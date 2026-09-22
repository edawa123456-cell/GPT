'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const VEHICLE_SURCHARGE = {
  Sedan: 0,
  SUV: 15,
  Pickup: 15,
};

const HOOKUP_FEE = 80;
const PER_MILE = 7;
const MINIMUM_CHARGE = 100;
const NON_ROLLING_SURCHARGE = 40;
const AFTER_HOURS_SURCHARGE = 60;

function isAfterHours(dateValue, timeValue) {
  if (!dateValue || !timeValue) return false;
  const local = new Date(`${dateValue}T${timeValue}:00`);
  if (Number.isNaN(local.getTime())) return false;
  const day = local.getDay();
  const [hour, minute] = timeValue.split(':').map(Number);
  const minutes = hour * 60 + minute;
  const open = 8 * 60;
  const close = 18 * 60;
  return day === 0 || minutes < open || minutes >= close;
}

function loadGoogleMaps(apiKey) {
  return new Promise((resolve, reject) => {
    if (!apiKey) return reject(new Error('Missing Google Maps browser key'));
    if (window.google?.maps?.importLibrary) return resolve(window.google);

    const existing = document.getElementById('google-maps-script');
    if (existing) {
      const done = () => window.google?.maps?.importLibrary
        ? resolve(window.google)
        : reject(new Error('Google Maps loaded, but the Maps JavaScript API is unavailable.'));
      existing.addEventListener('load', done, { once: true });
      existing.addEventListener('error', () => reject(new Error('Google Maps JavaScript failed to load.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => window.google?.maps?.importLibrary
      ? resolve(window.google)
      : reject(new Error('Google Maps loaded, but the Maps JavaScript API is unavailable.'));
    script.onerror = () => reject(new Error('Google Maps JavaScript failed to load. Check the browser API key restrictions.'));
    document.head.appendChild(script);
  });
}

function AddressInput({ label, placeholder, value, onChange, placesReady, onPlacesError }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);
  const requestId = useRef(0);

  useEffect(() => {
    if (!placesReady || value.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      const id = ++requestId.current;
      try {
        const { AutocompleteSuggestion, AutocompleteSessionToken } = await window.google.maps.importLibrary('places');
        let token = sessionToken;
        if (!token) {
          token = new AutocompleteSessionToken();
          setSessionToken(token);
        }
        const { suggestions: results = [] } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: value,
          includedRegionCodes: ['us'],
          sessionToken: token,
        });
        if (id !== requestId.current) return;
        const items = results
          .map((item) => item.placePrediction)
          .filter(Boolean)
          .slice(0, 6)
          .map((prediction) => ({
            text: prediction.text?.toString?.() || '',
            prediction,
          }))
          .filter((item) => item.text);
        setSuggestions(items);
        setOpen(items.length > 0);
      } catch (error) {
        setSuggestions([]);
        setOpen(false);
        onPlacesError(error?.message || 'Google address suggestions could not load.');
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [value, placesReady]);

  function choose(item) {
    onChange(item.text);
    setSuggestions([]);
    setOpen(false);
    setSessionToken(null);
  }

  return (
    <div className="addressField">
      <label>{label}</label>
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => suggestions.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <div className="addressSuggestions" role="listbox">
          {suggestions.map((item, index) => (
            <button key={`${item.text}-${index}`} type="button" className="addressSuggestion" onMouseDown={(e) => e.preventDefault()} onClick={() => choose(item)}>
              <span className="pin">⌖</span><span>{item.text}</span>
            </button>
          ))}
          <div className="googleAttribution">Powered by Google</div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [vehicle, setVehicle] = useState('Sedan');
  const [rolls, setRolls] = useState('Yes');
  const [timing, setTiming] = useState('ASAP');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [route, setRoute] = useState(null);
  const [routeError, setRouteError] = useState('');
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [booked, setBooked] = useState(false);

  const [placesReady, setPlacesReady] = useState(false);
  const [placesError, setPlacesError] = useState('');

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
      setPlacesError('Address suggestions are not configured yet.');
      return;
    }

    loadGoogleMaps(key)
      .then(async () => {
        await window.google.maps.importLibrary('places');
        setPlacesReady(true);
        setPlacesError('');
      })
      .catch((error) => {
        setPlacesReady(false);
        setPlacesError(error?.message || 'Google address suggestions could not load.');
      });
  }, []);

  const afterHours = useMemo(() => {
    if (timing === 'Schedule for later') {
      return isAfterHours(scheduledDate, scheduledTime);
    }
    const now = new Date();
    const day = now.getDay();
    const mins = now.getHours() * 60 + now.getMinutes();
    return day === 0 || mins < 8 * 60 || mins >= 18 * 60;
  }, [timing, scheduledDate, scheduledTime]);

  const quote = useMemo(() => {
    if (!route) return null;
    const mileageCharge = route.billedMiles * PER_MILE;
    const vehicleCharge = VEHICLE_SURCHARGE[vehicle] || 0;
    const rollingCharge = rolls === 'No' ? NON_ROLLING_SURCHARGE : 0;
    const hoursCharge = afterHours ? AFTER_HOURS_SURCHARGE : 0;
    const subtotal = HOOKUP_FEE + mileageCharge + vehicleCharge + rollingCharge + hoursCharge;
    return Math.max(MINIMUM_CHARGE, subtotal);
  }, [route, vehicle, rolls, afterHours]);

  async function getQuote(e) {
    e.preventDefault();
    setRouteError('');
    setBooked(false);
    setShowQuote(false);

    if (!pickup.trim() || !dropoff.trim()) {
      setRouteError('Please enter both pickup and drop-off addresses.');
      return;
    }
    if (timing === 'Schedule for later' && (!scheduledDate || !scheduledTime)) {
      setRouteError('Please choose a pickup date and time.');
      return;
    }

    setLoadingRoute(true);
    try {
      const response = await fetch('/api/route-distance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: pickup, destination: dropoff })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not calculate route.');
      setRoute(data);
      setShowQuote(true);
    } catch (error) {
      setRouteError(error.message);
    } finally {
      setLoadingRoute(false);
    }
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
          <div className="trustRow"><span>Upfront pricing</span><span>Online booking</span><span>Local trucks</span></div>
        </div>

        <div className="bookingCard">
          {!booked ? (
            <form onSubmit={getQuote}>
              <div className="stepTitle">Get your towing price</div>

              <AddressInput label="Pickup location" placeholder="Start typing the pickup address" value={pickup} placesReady={placesReady} onPlacesError={setPlacesError} onChange={(value) => { setPickup(value); setRoute(null); setShowQuote(false); }} />

              <AddressInput label="Drop-off location" placeholder="Start typing the destination" value={dropoff} placesReady={placesReady} onPlacesError={setPlacesError} onChange={(value) => { setDropoff(value); setRoute(null); setShowQuote(false); }} />
              {placesError && <div className="placesNotice">Address suggestions: {placesError}</div>}

              <div className="twoCol">
                <div>
                  <label>Vehicle type</label>
                  <select value={vehicle} onChange={e => setVehicle(e.target.value)}>
                    <option>Sedan</option>
                    <option>SUV</option>
                    <option>Pickup</option>
                  </select>
                </div>
                <div>
                  <label>Does it roll?</label>
                  <select value={rolls} onChange={e => setRolls(e.target.value)}>
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </div>
              </div>

              <label>When?</label>
              <select value={timing} onChange={e => setTiming(e.target.value)}>
                <option>ASAP</option>
                <option>Schedule for later</option>
              </select>

              {timing === 'Schedule for later' && (
                <div className="twoCol scheduleRow">
                  <div><label>Pickup date</label><input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} /></div>
                  <div><label>Pickup time</label><input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} /></div>
                </div>
              )}

              <button className="primary" type="submit" disabled={loadingRoute}>{loadingRoute ? 'CALCULATING ROUTE...' : 'GET MY PRICE'}</button>
              {routeError && <div className="errorBox">{routeError}</div>}

              {showQuote && quote !== null && (
                <div className="quoteArea">
                  <div className="routeInfo">
                    <span>Driving distance: <strong>{route.exactMiles} mi</strong></span>
                    <span>Billed mileage: <strong>{route.billedMiles} mi</strong></span>
                  </div>
                  <div className="quoteBox">
                    <div><div className="quoteLabel">Your tow price</div><div className="quotePrice">${quote}</div></div>
                    <button className="bookButton" type="button" onClick={() => setBooked(true)}>BOOK THIS TOW</button>
                  </div>
                  <details className="breakdown">
                    <summary>Price breakdown</summary>
                    <div><span>Hookup</span><strong>${HOOKUP_FEE}</strong></div>
                    <div><span>{route.billedMiles} mi × ${PER_MILE}</span><strong>${route.billedMiles * PER_MILE}</strong></div>
                    {VEHICLE_SURCHARGE[vehicle] > 0 && <div><span>{vehicle} surcharge</span><strong>+${VEHICLE_SURCHARGE[vehicle]}</strong></div>}
                    {rolls === 'No' && <div><span>Doesn't roll</span><strong>+${NON_ROLLING_SURCHARGE}</strong></div>}
                    {afterHours && <div><span>After-hours</span><strong>+${AFTER_HOURS_SURCHARGE}</strong></div>}
                    <div><span>Minimum charge</span><strong>${MINIMUM_CHARGE}</strong></div>
                  </details>
                </div>
              )}

              <p className="finePrint">Business hours: Monday–Saturday, 8:00 AM–6:00 PM. Sunday and outside business hours add $60. Mileage is rounded up to the next whole mile.</p>
            </form>
          ) : (
            <div className="confirmation">
              <div className="check">✓</div>
              <h2>Tow request ready</h2>
              <p>This is the next step we will connect to the customer information and SMS booking confirmation.</p>
              <div className="summary">
                <div><span>Pickup</span><strong>{pickup}</strong></div>
                <div><span>Destination</span><strong>{dropoff}</strong></div>
                <div><span>Distance</span><strong>{route?.exactMiles} mi ({route?.billedMiles} billed)</strong></div>
                <div><span>Vehicle</span><strong>{vehicle}</strong></div>
                <div><span>Rolls</span><strong>{rolls}</strong></div>
                <div><span>Timing</span><strong>{timing === 'ASAP' ? 'ASAP' : `${scheduledDate} ${scheduledTime}`}</strong></div>
                <div><span>Price</span><strong>${quote}</strong></div>
              </div>
              <button className="primary" onClick={() => { setBooked(false); setShowQuote(false); setRoute(null); }}>START ANOTHER</button>
            </div>
          )}
        </div>
      </section>

      <section className="how">
        <div className="sectionKicker">HOW IT WORKS</div>
        <h2>Book a tow in three simple steps.</h2>
        <div className="steps">
          <article><div className="num">1</div><h3>Enter locations</h3><p>Start typing and choose the pickup and destination addresses.</p></article>
          <article><div className="num">2</div><h3>See your price</h3><p>We calculate the driving route and apply clear towing rates.</p></article>
          <article><div className="num">3</div><h3>Request your tow</h3><p>Confirm online. Customer SMS and owner notifications are the next connection.</p></article>
        </div>
      </section>
      <footer>© {new Date().getFullYear()} Tow Truck On Demand</footer>
    </main>
  );
}
