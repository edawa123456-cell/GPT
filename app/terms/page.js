
export const metadata = {
  title: "Terms & Conditions | TowTruckOnDemand",
  description: "Terms and Conditions for TowTruckOnDemand.",
};

export default function TermsPage() {
  return (
    <main
      style={{
        maxWidth: 800,
        margin: "50px auto",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
        lineHeight: 1.7,
        color: "#172033",
      }}
    >
      <a href="/" style={{ color: "#0866e8" }}>
        ← Back to TowTruckOnDemand
      </a>

      <h1>Terms & Conditions</h1>
      <p>Last updated: October 18, 2026</p>

      <p>
        Welcome to TowTruckOnDemand. By using
        towtruckondemand.com or submitting a towing
        request, you agree to these Terms & Conditions.
      </p>

      <h2>1. Towing Services</h2>
      <p>
        TowTruckOnDemand provides an online platform
        for requesting towing services. Service is
        subject to availability, location, vehicle
        condition, and operational limitations.
      </p>

      <h2>2. Quotes and Pricing</h2>
      <p>
        Our website calculates towing estimates based
        on driving distance, vehicle type, vehicle
        condition, and requested service time.
        Additional charges may apply if the information
        provided is inaccurate or circumstances change.
        Any changes should be communicated to the
        customer before service.
      </p>

      <h2>3. Booking Requests</h2>
      <p>
        Submitting a towing request does not guarantee
        immediate service or a dispatched tow truck.
        Our team may contact you to verify the request
        and confirm availability.
      </p>

      <h2>4. Payment</h2>
      <p>
        Payment arrangements and accepted payment
        methods are communicated when service is
        confirmed. No online payment is required
        to submit a towing request through our website.
      </p>

      <h2>5. SMS Terms & Conditions</h2>
      <p>
        TowTruckOnDemand offers an optional SMS
        confirmation service. Customers who actively
        select the SMS consent checkbox when submitting
        a towing request agree to receive one
        transactional text message confirming receipt
        of that request.
      </p>

      <p>
        Message frequency: One confirmation message
        per opted-in towing request. No recurring
        marketing messages are sent through this
        SMS program.
      </p>

      <p>
        Message and data rates may apply. Reply STOP
        to opt out of SMS messages or HELP for
        assistance. Consent to receive SMS messages
        is not required to request towing services.
      </p>

      <p>
        Mobile carriers are not responsible for
        delayed or undelivered messages.
      </p>

      <h2>6. Privacy</h2>
      <p>
        Please review our{" "}
        <a href="/privacy-policy">
          Privacy Policy
        </a>{" "}
        for information about how customer data
        and SMS consent information are handled.
      </p>

      <h2>7. Customer Responsibilities</h2>
      <p>
        Customers are responsible for providing
        accurate contact information, vehicle details,
        pickup locations, and destinations. Customers
        must have authorization to request towing
        for the vehicle involved.
      </p>

      <h2>8. Changes to These Terms</h2>
      <p>
        TowTruckOnDemand may update these terms
        periodically. Updates will be posted
        on this page with a revised date.
      </p>

      <h2>9. Contact Information</h2>
      <p>
        TowTruckOnDemand
        <br />
        Website:{" "}
        <a href="https://towtruckondemand.com">
          towtruckondemand.com
        </a>
        <br />
        Phone:{" "}
        <a href="tel:+12108062061">
          (210) 806-2061
        </a>
      </p>
    </main>
  );
}
