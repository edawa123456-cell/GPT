import { randomUUID } from 'node:crypto';
import { saveBooking, claimNotification, finishNotification } from '../../lib/bookingStore';
import { BookingValidationError, validateBooking, validationMessage } from '../../lib/bookingValidation';
import { NextResponse } from "next/server";

export const runtime = 'nodejs';

export async function POST(request) {
  let savedBooking;
  let notification;
  const spanish = (body) => body?.locale === 'es';
  try {
    let rawBody;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: validationMessage({ code: 'body' }), errorCode: 'body', field: 'body' }, { status: 400 });
    }
    let result;
    try {
      result = validateBooking(rawBody);
    } catch (error) {
      if (!(error instanceof BookingValidationError)) throw error;
      return NextResponse.json({
        error: validationMessage(error, rawBody?.locale),
        errorCode: error.code, field: error.field,
      }, { status: 400 });
    }
    const requestKey = request.headers.get('Idempotency-Key') || randomUUID();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestKey)) {
      return NextResponse.json({ error: 'Invalid request key.' }, { status: 400 });
    }
    savedBooking = await saveBooking(result.booking, result.requestedTiming, requestKey);
    if (savedBooking.notification_status === 'sent') {
      return NextResponse.json({ success: true, reference: savedBooking.reference, duplicate: true });
    }
    const body = savedBooking.payload;
    const requestedTiming = savedBooking.requested_timing;

    const {
      locale,
      customerName,
      customerPhone,
      vehicleDetails,
      pickup,
      pickupCoordinates,
      pickupNotes,
      destination,
      miles,
      total,
      vehicleType,
            leadSource,

    } = body;

    const nonRolling = body.nonRolling;
    const afterHours = requestedTiming.afterHours;
    const subjectPrefix = requestedTiming.subject;
    const customerLabel = String(customerName || customerPhone || 'Customer').replace(/[\r\n]/g, ' ').slice(0, 100);

    const hasPin = pickupCoordinates != null;
    const validPin = hasPin && typeof pickupCoordinates.lat === 'number' && typeof pickupCoordinates.lng === 'number' && Number.isFinite(pickupCoordinates.lat) && Number.isFinite(pickupCoordinates.lng) && Math.abs(pickupCoordinates.lat) <= 90 && Math.abs(pickupCoordinates.lng) <= 180;
    if (hasPin && !validPin) return NextResponse.json({ error: 'Invalid pickup coordinates.' }, { status: 400 });
    const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    const mapsLink = validPin ? `https://www.google.com/maps/search/?api=1&query=${pickupCoordinates.lat},${pickupCoordinates.lng}` : null;

    if (!process.env.RESEND_API_KEY || !process.env.TOW_REQUEST_EMAIL) {
      throw new Error('Notification service is not configured');
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: auto;">
        <h1 style="margin-bottom: 5px;">New Tow Request</h1>
        <p><strong>Booking reference:</strong> ${savedBooking.reference}</p>

        <div style="padding:16px;background:${requestedTiming.kind === 'scheduled' ? '#fff3cd' : '#eef5ff'};border:2px solid #172033;border-radius:8px;margin:16px 0;">
          <strong style="font-size:20px;">${requestedTiming.kind === 'scheduled' ? 'SCHEDULED PICKUP — NOT AN IMMEDIATE DISPATCH' : requestedTiming.kind === 'asap' ? 'ASAP REQUEST' : 'CONFIRM PICKUP TIME BEFORE DISPATCH'}</strong>
          <p style="font-size:20px;margin:8px 0 0;">${escapeHtml(requestedTiming.label)}</p>
        </div>

        <p style="font-size: 20px; font-weight: bold;">
          Quote: $${total ?? "N/A"}
        </p>

        <hr />

        <p><strong>Customer language:</strong> ${locale === "es" ? "Spanish" : "English"}</p>
        <h2>Customer</h2>

        <p>
          <strong>Name:</strong>
          ${customerName || "Not provided"}
        </p>

        <p>
          <strong>Phone:</strong>
          ${customerPhone || "Not provided"}
        </p>

        <h2>Vehicle</h2>

        <p>
          <strong>Vehicle:</strong>
          ${vehicleDetails || "Not provided"}
        </p>

        <p>
          <strong>Vehicle Type:</strong>
          ${vehicleType || "Not provided"}
        </p>

        <p>
          <strong>Non-Rolling:</strong>
          ${nonRolling === null ? "Not provided — confirm with customer" : nonRolling ? "Yes" : "No"}
        </p>

        <h2>Trip</h2>

        <p>
          <strong>Pickup:</strong><br />
          ${escapeHtml(pickup || "Not provided")}
        </p>

        ${mapsLink ? `<p><strong>Confirmed pickup pin:</strong> ${pickupCoordinates.lat}, ${pickupCoordinates.lng}<br /><a href="${mapsLink}">Open pickup pin in Google Maps</a></p>` : ''}
        ${pickupNotes ? `<p><strong>Pickup notes:</strong> ${escapeHtml(String(pickupNotes).slice(0, 500))}</p>` : ''}

        <p>
          <strong>Destination:</strong><br />
          ${destination || "Not provided"}
        </p>

        <p>
          <strong>Distance:</strong>
          ${miles ?? "N/A"} miles
        </p>

        <h2>Requested Pickup</h2>
        <p>${escapeHtml(requestedTiming.label)}</p>

        <p>
          <strong>After Hours:</strong>
          ${afterHours === null ? "Not provided" : afterHours ? "Yes" : "No"}
        </p>

       <p>
  <strong>Lead Source:</strong>
  ${leadSource || "Direct"}
</p>
<hr />

        <p style="font-size: 13px; color: #666;">
          Submitted through TowTruckOnDemand
        </p>
      </div>
    `;

    const emailPayload = {
      from: "TowTruckOnDemand <notifications@towtruckondemand.com>",
      to: [process.env.TOW_REQUEST_EMAIL],
      subject: `[${subjectPrefix}] ${savedBooking.reference} - ${customerLabel}`,
      html: emailHtml,
    };
    notification = await claimNotification(savedBooking.id, emailPayload);
    if (!notification) {
      return NextResponse.json({ saved: true, reference: savedBooking.reference,
        errorCode: 'notification_pending',
        error: spanish(body)
          ? `Solicitud guardada: ${savedBooking.reference}. La notificación no está confirmada. Llámanos con esta referencia antes de esperar una grúa.`
          : `Request saved: ${savedBooking.reference}. Notification is not confirmed. Please call us with this reference before waiting for a truck.`,
      }, { status: 503 });
    }
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `ttod-booking/${savedBooking.id}`,
      },
      body: JSON.stringify(notification.notification_payload),
      signal: AbortSignal.timeout(20000),
    });
    const resendData = await resendResponse.json();
    if (!resendResponse.ok || !resendData.id) throw new Error('Notification provider rejected request');
    await finishNotification(savedBooking.id, notification.lease_token, resendData.id);
    return NextResponse.json({ success: true, reference: savedBooking.reference,
      duplicate: savedBooking.duplicate, message: "Tow request sent successfully." });
  } catch (error) {
    // Do not log customer payloads or database URLs.
    console.error("Tow request failed", { code: error.code || 'BOOKING_ERROR', saved: Boolean(savedBooking) });
    if (savedBooking) {
      if (notification) {
        try { await finishNotification(savedBooking.id, notification.lease_token); } catch { /* retain lease for safe retry */ }
      }
      return NextResponse.json({ saved: true, reference: savedBooking.reference,
        errorCode: 'notification_failed',
        error: spanish(savedBooking.payload)
          ? `Solicitud guardada: ${savedBooking.reference}, pero no pudimos confirmar la notificación. Inténtalo otra vez o llámanos con esta referencia.`
          : `Request saved: ${savedBooking.reference}, but notification could not be confirmed. Please retry or call us with this reference.`,
      }, { status: 503 });
    }
    if (error.code === 'REQUEST_CONFLICT') {
      return NextResponse.json({ error: 'Request details changed. Please refresh and try again.' }, { status: 409 });
    }

    return NextResponse.json(
      { error: "Unable to save your request. Please try again or call us. Your booking is not confirmed." },
      { status: 503 }
    );
  }
}
