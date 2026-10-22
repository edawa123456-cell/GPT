import { createHash, randomUUID } from 'node:crypto';
import pg from 'pg';

let pool;
function database() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) throw new Error('Booking database is not configured');
  return pool ||= new pg.Pool({ connectionString, max: 3, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000 });
}

// Explicit fields prevent arbitrary client properties being retained in the database.
export function bookingSnapshot(body, timing) {
  return {
    locale: body.locale === 'es' ? 'es' : 'en',
    customerName: body.customerName, customerPhone: body.customerPhone,
    vehicleDetails: body.vehicleDetails, pickup: body.pickup,
    pickupCoordinates: body.pickupCoordinates || null,
    destination: body.destination, vehicleType: body.vehicleType,
    nonRolling: body.nonRolling, total: body.total ?? null, miles: body.miles ?? null,
    smsConsent: body.smsConsent === true,
    leadSource: String(body.leadSource || 'Direct').slice(0, 200),
    pickupNotes: String(body.pickupNotes || '').slice(0, 500),
    timing: timing.kind, scheduledDate: timing.date, scheduledTime: timing.time,
    timeZone: 'America/Chicago',
  };
}
export function bookingFingerprint(snapshot) {
  return createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
}

export async function saveBooking(body, timing, requestKey) {
  const snapshot = bookingSnapshot(body, timing);
  const fingerprint = bookingFingerprint(snapshot);
  const client = await database().connect();
  try {
    await client.query('BEGIN');
    // Serialize retries for a request key, then identical submissions across devices/tabs.
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`request:${requestKey}`]);
    let { rows } = await client.query(`SELECT b.*, r.fingerprint AS request_fingerprint
      FROM ttod_booking_requests r JOIN ttod_bookings b ON b.id = r.booking_id
      WHERE r.request_key = $1`, [requestKey]);
    let booking = rows[0];
    let duplicate = Boolean(booking);
    if (booking && booking.request_fingerprint !== fingerprint) {
      const error = new Error('Request key was already used for different details');
      error.code = 'REQUEST_CONFLICT'; throw error;
    }
    if (!booking) {
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`booking:${fingerprint}`]);
      ({ rows } = await client.query(`SELECT * FROM ttod_bookings
        WHERE fingerprint = $1 AND created_at > now() - interval '10 minutes'
        ORDER BY created_at DESC LIMIT 1`, [fingerprint]));
      booking = rows[0]; duplicate = Boolean(booking);
      if (!booking) {
        const id = randomUUID();
        const reference = `TTOD-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${id.replaceAll('-', '').slice(0, 12).toUpperCase()}`;
        ({ rows } = await client.query(`INSERT INTO ttod_bookings
          (id, reference, fingerprint, payload, requested_timing)
          VALUES ($1, $2, $3, $4::jsonb, $5::jsonb) RETURNING *`,
        [id, reference, fingerprint, JSON.stringify(snapshot), JSON.stringify(timing)]));
        booking = rows[0];
      }
      await client.query(`INSERT INTO ttod_booking_requests (request_key, booking_id, fingerprint)
        VALUES ($1, $2, $3)`, [requestKey, booking.id, fingerprint]);
    }
    await client.query('COMMIT');
    return { ...booking, duplicate };
  } catch (error) {
    await client.query('ROLLBACK'); throw error;
  } finally { client.release(); }
}

// Lease prevents simultaneous workers sending the same notification. A crashed worker
// can be retried after 60 seconds, using the same frozen Resend payload and key.
export async function claimNotification(id, payload) {
  const token = randomUUID();
  const { rows } = await database().query(`UPDATE ttod_bookings SET
    notification_status = 'sending', lease_token = $2,
    lease_until = now() + interval '60 seconds',
    notification_payload = COALESCE(notification_payload, $3::jsonb),
    first_attempt_at = COALESCE(first_attempt_at, now()), attempts = attempts + 1
    WHERE id = $1 AND notification_status <> 'sent'
      AND (lease_until IS NULL OR lease_until < now())
      AND (first_attempt_at IS NULL OR first_attempt_at > now() - interval '23 hours')
    RETURNING notification_payload, lease_token`, [id, token, JSON.stringify(payload)]);
  return rows[0] || null;
}
export async function finishNotification(id, token, emailId = null) {
  await database().query(`UPDATE ttod_bookings SET notification_status = $3,
    email_id = COALESCE($4, email_id), lease_token = NULL, lease_until = NULL
    WHERE id = $1 AND lease_token = $2`, [id, token, emailId ? 'sent' : 'failed', emailId]);
}
