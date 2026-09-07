'use client';

import { useMemo, useState } from 'react';

const vehicleAdjustments = {
  Sedan: 0,
  SUV: 10,
  Pickup: 15,
  Motorcycle: -10,
  Other: 15,
};

const conditionAdjustments = {
  'Runs and rolls normally': 0,
  'Will not start': 25,
  'Flat or locked wheel': 20,
  'Accident / damaged': 35,
  'Needs winching': 50,
};

export default function Home() {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [vehicle, setVehicle] = useState('Sedan');
  const [condition, setCondition] = useState('Runs and rolls normally');
  const [timing, setTiming] = useState('ASAP');
  const [miles, setMiles] = useState(10);
  const [showQuote, setShowQuote] = useState(false);
  const [booked, setBooked] = useState(false);

  const quote = useMemo(() => {
    const base = 75;
    const includedMiles = 5;
    const extraMiles = Math.max(0, Number(miles || 0) - includedMiles);
    const mileage = extraMiles * 4.5;
    const total = base + mileage + vehicleAdjustments[vehicle] + conditionAdjustments[condition];
    return Math.max(85, Math.round(total));
  }, [miles, vehicle, condition]);

  function getQuote(e) {
    e.preventDefault();
    if (!pickup.trim() || !dropoff.trim()) return;
    setShowQuote(true);
    setBooked(false);
  }

  return (
    <main>
      <header className="nav">
        <div className="brand">
          <span className="brandTop">TowTruck</span>
          <span className="brandBottom">OnDemand</span>
        </div>
        <a className="callLink" href="tel:#">Call us</a>
      </header>

      <section className="hero">
        <div className="heroCopy">
          <div className="eyebrow">TOWING, WITHOUT THE PHONE CALL</div>
          <h1>Need a tow?</h1>
          <p className="lede">Enter your pickup and destination, see your price, and request service online.</p>
          <div className="trustRow">
            <span>Upfront pricing</span><span>Online booking</span><span>Local trucks</span>
          </div>
        </div>

        <div className="bookingCard">
          {!booked ? (
            <form onSubmit={getQuote}>
              <div className="stepTitle">Get your towing price</div>
              <label>Pickup location</label>
              <input value={pickup} onChange={e => setPickup(e.target.value)} placeholder="Where is the vehicle?" />

              <label>Drop-off location</label>
              <input value={dropoff} onChange={e => setDropoff(e.target.value)} placeholder="Where is it going?" />

              <div className="twoCol">
                <div>
                  <label>Vehicle type</label>
                  <select value={vehicle} onChange={e => setVehicle(e.target.value)}>
                    {Object.keys(vehicleAdjustments).map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label>When?</label>
                  <select value={timing} onChange={e => setTiming(e.target.value)}>
                    <option>ASAP</option>
                    <option>Schedule for later</option>
                  </select>
                </div>
              </div>

              <label>Vehicle condition</label>
              <select value={condition} onChange={e => setCondition(e.target.value)}>
                {Object.keys(conditionAdjustments).map(v => <option key={v}>{v}</option>)}
              </select>

              <label>Estimated towing distance <span className="muted">(preview only)</span></label>
              <div className="milesInput"><input type="number" min="0" value={miles} onChange={e => setMiles(e.target.value)} /><span>miles</span></div>

              <button className="primary" type="submit">GET MY PRICE</button>

              {showQuote && (
                <div className="quoteBox">
                  <div>
                    <div className="quoteLabel">Estimated tow price</div>
                    <div className="quotePrice">${quote}</div>
                  </div>
                  <button className="bookButton" type="button" onClick={() => setBooked(true)}>BOOK THIS TOW</button>
                </div>
              )}
              <p className="finePrint">Preview pricing only. Google Maps distance, live service-area rules, payment and SMS can be connected next.</p>
            </form>
          ) : (
            <div className="confirmation">
              <div className="check">✓</div>
              <h2>Tow request received</h2>
              <p>Your preview booking is ready.</p>
              <div className="summary">
                <div><span>Pickup</span><strong>{pickup}</strong></div>
                <div><span>Destination</span><strong>{dropoff}</strong></div>
                <div><span>Vehicle</span><strong>{vehicle}</strong></div>
                <div><span>Timing</span><strong>{timing}</strong></div>
                <div><span>Estimated price</span><strong>${quote}</strong></div>
              </div>
              <button className="primary" onClick={() => {setBooked(false); setShowQuote(false);}}>START ANOTHER</button>
            </div>
          )}
        </div>
      </section>

      <section className="how">
        <div className="sectionKicker">HOW IT WORKS</div>
        <h2>Book a tow in three simple steps.</h2>
        <div className="steps">
          <article><div className="num">1</div><h3>Enter locations</h3><p>Tell us where the vehicle is and where it needs to go.</p></article>
          <article><div className="num">2</div><h3>See your price</h3><p>Get a clear quote based on distance, vehicle type and condition.</p></article>
          <article><div className="num">3</div><h3>Request your tow</h3><p>Confirm your tow online and receive your booking details.</p></article>
        </div>
      </section>

      <footer>© {new Date().getFullYear()} Tow Truck On Demand</footer>
    </main>
  );
}
