import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
console.log("TOW REQUEST BODY:", body);
    const {
      customerName,
      customerPhone,
      vehicleDetails,
      pickup,
      destination,
      miles,
      total,
      date,
      time,
      vehicleType,
      nonRolling,
      afterHours,
    } = body;

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

        <p style="font-size: 20px; font-weight: bold;">
          Quote: $${total ?? "N/A"}
        </p>

        <hr />

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
          ${nonRolling ? "Yes" : "No"}
        </p>

        <h2>Trip</h2>

        <p>
          <strong>Pickup:</strong><br />
          ${pickup || "Not provided"}
        </p>

        <p>
          <strong>Destination:</strong><br />
          ${destination || "Not provided"}
        </p>

        <p>
          <strong>Distance:</strong>
          ${miles ?? "N/A"} miles
        </p>

        <h2>Requested Time</h2>

        <p>
          <strong>Date:</strong>
          ${date || "Not provided"}
        </p>

        <p>
          <strong>Time:</strong>
          ${time || "Not provided"}
        </p>

        <p>
          <strong>After Hours:</strong>
          ${afterHours ? "Yes" : "No"}
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
        from: "TowTruckOnDemand <onboarding@resend.dev>",
        to: ["edawa123456@gmail.com"],
        subject: `New Tow Request - ${customerName || customerPhone || "Customer"}`,
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
