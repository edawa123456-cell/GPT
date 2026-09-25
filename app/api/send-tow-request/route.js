export async function POST(request) {
  try {
    const {
      name,
      phone,
      vehicle,
      pickup,
      destination,
      price,
      miles,
      vehicleType,
      rolls,
      when,
    } = await request.json();

    if (!name || !phone || !vehicle || !pickup || !destination || !price) {
      return Response.json(
        { error: 'Missing required tow information.' },
        { status: 400 }
      );
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;
    const toNumber = process.env.TOW_REQUEST_TO_NUMBER;

    if (!accountSid || !authToken || !fromNumber || !toNumber) {
      console.error('Missing Twilio environment variables.');

      return Response.json(
        { error: 'SMS service is not configured.' },
        { status: 500 }
      );
    }

    const message = [
      'NEW TOW REQUEST',
      '',
      `Customer: ${name}`,
      `Phone: ${phone}`,
      `Vehicle: ${vehicle}`,
      vehicleType ? `Type: ${vehicleType}` : null,
      rolls ? `Rolls: ${rolls}` : null,
      '',
      `Pickup: ${pickup}`,
      `Drop-off: ${destination}`,
      miles ? `Distance: ${miles} miles` : null,
      when ? `When: ${when}` : null,
      '',
      `QUOTE: $${price}`,
    ]
      .filter(Boolean)
      .join('\n');

    const body = new URLSearchParams({
      To: toNumber,
      From: fromNumber,
      Body: message,
    });

    const credentials = Buffer.from(
      `${accountSid}:${authToken}`
    ).toString('base64');

    const twilioResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      }
    );

    const result = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error('Twilio error:', result);

      return Response.json(
        { error: 'Unable to send tow notification.' },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      messageSid: result.sid,
    });
  } catch (error) {
    console.error('Tow request error:', error);

    return Response.json(
      { error: 'Unable to process tow request.' },
      { status: 500 }
    );
  }
}
