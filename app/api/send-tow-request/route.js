import { BookingValidationError, validateBooking, validationMessage } from '../../lib/bookingValidation';
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    let rawBody;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: validationMessage({ code: 'body' }), errorCode: 'body', field: 'body' }, { status: 400 });
    }
    const evaluatedAt = new Date();
    let result;
    try {
      result = validateBooking(rawBody, { now: evaluatedAt });
    } catch (error) {
      if (!(error instanceof BookingValidationError)) throw error;
      return NextResponse.json({
        error: validationMessage(error, rawBody?.locale),
        errorCode: error.code, field: error.field,
      }, { status: 400 });
    }
    const { booking: body, requestedTiming } = result;
    // Guard the timing boundary between the customer's last price check and arrival
    // at the server. This does not verify route distance or replace price validation.
    if (body.quotedAfterHours != null && typeof body.quotedAfterHours !== 'boolean') {
      return NextResponse.json({ error: 'Invalid quoted service hours.' }, { status: 400 });
    }
    if (requestedTiming.kind === 'asap' && typeof body.quotedAfterHours === 'boolean'
      && body.quotedAfterHours !== requestedTiming.afterHours) {
      return NextResponse.json({
        errorCode: 'pickup_hours_changed', afterHours: requestedTiming.afterHours,
        evaluatedAt: evaluatedAt.toISOString(),
        error: body.locale === 'es'
          ? 'Cambió el horario de servicio. Revisa el precio actualizado y confirma otra vez.'
          : 'Service hours changed. Review the updated price and confirm again.',
      }, { status: 409 });
    }

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

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is missing");
      return NextResponse.json(
        { error: "Email service is not configured." },
        { status: 500 }
      );
    }

    if (!process.env.TOW_REQUEST_EMAIL) {
      console.error("TOW_REQUEST_EMAIL is missing");
      return NextResponse.json(
        { error: "Tow request email is not configured." },
        { status: 500 }
      );
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: auto;">
        <h1 style="margin-bottom: 5px;">New Tow Request</h1>

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

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
       from: "TowTruckOnDemand <notifications@towtruckondemand.com>",
to: [process.env.TOW_REQUEST_EMAIL],
        subject: `[${subjectPrefix}] New Tow Request - ${customerLabel}`,
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend error:", resendData);

      return NextResponse.json(
        {
          error: "Unable to send tow notification.",
          details: resendData,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Tow request sent successfully.",
      emailId: resendData.id,
    });
  } catch (error) {
    console.error("Tow request error:", error);

    return NextResponse.json(
      { error: "Unable to process tow request." },
      { status: 500 }
    );
  }
}
