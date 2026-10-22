import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';

// Run production SQL against embedded PostgreSQL; external email is always mocked.
const db = new PGlite();
await db.exec(await readFile(new URL('../database/001-bookings.sql', import.meta.url), 'utf8'));
await db.exec(await readFile(new URL('../database/001-bookings.sql', import.meta.url), 'utf8'));
globalThis.__bookingTestDatabase = {
  query: (sql, args) => db.query(sql, args),
  connect: async () => ({ query: (sql, args) => db.query(sql, args), release() {} }),
};
const url = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const storeUrl = url((await readFile(new URL('../app/lib/bookingStore.js', import.meta.url), 'utf8'))
  .replace("import pg from 'pg';", 'const pg = { Pool: class { constructor() { return globalThis.__bookingTestDatabase; } } };'));
const store = await import(storeUrl);
const timingUrl = url(await readFile(new URL('../app/lib/bookingTiming.js', import.meta.url), 'utf8'));
const validationUrl = url((await readFile(new URL('../app/lib/bookingValidation.js', import.meta.url), 'utf8')).replace("'./bookingTiming'", JSON.stringify(timingUrl)));
const { POST } = await import(url((await readFile(new URL('../app/api/send-tow-request/route.js', import.meta.url), 'utf8'))
  .replace("'../../lib/bookingValidation'", JSON.stringify(validationUrl))
  .replace("'../../lib/bookingStore'", JSON.stringify(storeUrl))
  .replace('import { NextResponse } from "next/server";', 'const NextResponse = { json: (body, init) => Response.json(body, init) };')));
process.env.DATABASE_URL = 'test-only';
process.env.RESEND_API_KEY = 'test-only';
process.env.TOW_REQUEST_EMAIL = 'test@example.invalid';
const body = phone => ({ locale: 'en', customerName: 'Test', customerPhone: phone,
  vehicleDetails: 'Toyota Camry', pickup: '200 Texas St, Fort Worth, TX',
  destination: 'Dallas, TX', vehicleType: 'Sedan', rolls: 'Yes', timing: 'ASAP',
  when: 'ASAP', total: 150, miles: 10, smsConsent: false });
const request = (payload, key = randomUUID()) => new Request('https://test.invalid', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key }, body: JSON.stringify(payload),
});
const originalFetch = global.fetch;
let sends = [];
global.fetch = async (endpoint, options) => {
  assert.equal(endpoint, 'https://api.resend.com/emails');
  sends.push({ payload: JSON.parse(options.body), key: options.headers['Idempotency-Key'] });
  return Response.json({ id: `email-${sends.length}` });
};
try {
  await test('record is durable before email, same key and new-key double submissions reuse reference', async () => {
    const payload = body('2108062061'), key = randomUUID();
    const before = sends.length;
    const first = await POST(request(payload, key)); assert.equal(first.status, 200);
    const receipt = await first.json(); assert.match(receipt.reference, /^TTOD-\d{8}-[A-F0-9]{12}$/);
    const same = await (await POST(request(payload, key))).json();
    const otherTab = await (await POST(request(payload))).json();
    assert.equal(same.reference, receipt.reference); assert.equal(same.duplicate, true);
    assert.equal(otherTab.reference, receipt.reference); assert.equal(sends.length, before + 1);
    const record = (await db.query('SELECT * FROM ttod_bookings WHERE reference=$1', [receipt.reference])).rows[0];
    assert.equal(record.notification_status, 'sent'); assert.equal(record.payload.customerPhone, '+12108062061');
    assert.equal(record.payload.timeZone, 'America/Chicago'); assert.equal(record.payload.smsConsent, false);
    assert.match(sends.at(-1).payload.html, new RegExp(receipt.reference));
  });
  await test('same request key with different content conflicts without another email', async () => {
    const key = randomUUID(), payload = body('2108062062');
    assert.equal((await POST(request(payload, key))).status, 200);
    const before = sends.length;
    assert.equal((await POST(request({ ...payload, destination: 'Austin, TX' }, key))).status, 409);
    assert.equal(sends.length, before);
  });
  await test('failed email retains booking; retry freezes recipient, payload and provider key', async () => {
    const payload = body('2108062063'), key = randomUUID();
    const goodFetch = global.fetch;
    let failedPayload;
    global.fetch = async (endpoint, options) => { failedPayload = options; return Response.json({ error: 'unavailable' }, { status: 503 }); };
    const failed = await POST(request(payload, key)); assert.equal(failed.status, 503);
    const saved = await failed.json(); assert.equal(saved.saved, true); assert.ok(saved.reference);
    const record = (await db.query('SELECT * FROM ttod_bookings WHERE reference=$1', [saved.reference])).rows[0];
    assert.equal(record.notification_status, 'failed');
    global.fetch = goodFetch;
    process.env.TOW_REQUEST_EMAIL = 'changed@example.invalid';
    const retried = await POST(request(payload, key)); assert.equal(retried.status, 200);
    assert.equal((await retried.json()).reference, saved.reference);
    assert.deepEqual(sends.at(-1).payload, JSON.parse(failedPayload.body));
    assert.equal(sends.at(-1).key, failedPayload.headers['Idempotency-Key']);
  });
  await test('notification lease excludes another worker; expired lease recovers; old ambiguity requires manual review', async () => {
    const timing = { kind: 'scheduled', date: '2099-10-23', time: '14:30', label: 'Future', subject: 'SCHEDULED', afterHours: false };
    const saved = await store.saveBooking(body('2108062064'), timing, randomUUID());
    const first = await store.claimNotification(saved.id, { subject: 'original' }); assert.ok(first);
    assert.equal(await store.claimNotification(saved.id, { subject: 'changed' }), null);
    await db.query("UPDATE ttod_bookings SET lease_until = now() - interval '1 second' WHERE id=$1", [saved.id]);
    const recovered = await store.claimNotification(saved.id, { subject: 'changed' });
    assert.deepEqual(recovered.notification_payload, { subject: 'original' });
    await store.finishNotification(saved.id, first.lease_token, 'stale-worker');
    assert.equal((await db.query('SELECT notification_status FROM ttod_bookings WHERE id=$1', [saved.id])).rows[0].notification_status, 'sending');
    await db.query("UPDATE ttod_bookings SET lease_until = NULL, first_attempt_at = now() - interval '25 hours' WHERE id=$1", [saved.id]);
    assert.equal(await store.claimNotification(saved.id, {}), null);
    assert.equal(saved.payload.scheduledTime, '14:30');
    assert.deepEqual(saved.requested_timing, timing);
  });
  await test('database unavailable sends no email and never returns a false confirmation', async () => {
    const query = globalThis.__bookingTestDatabase.connect;
    globalThis.__bookingTestDatabase.connect = async () => { throw new Error('offline'); };
    const before = sends.length;
    try {
      const response = await POST(request(body('2108062065')));
      assert.equal(response.status, 503); assert.equal(sends.length, before);
      const data = await response.json(); assert.equal(data.success, undefined); assert.equal(data.reference, undefined);
    } finally { globalThis.__bookingTestDatabase.connect = query; }
  });
} finally { global.fetch = originalFetch; delete globalThis.__bookingTestDatabase; await db.close(); }
