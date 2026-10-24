'use client';

import { centralNow, isAfterHoursCentral } from '../lib/bookingTiming';
import { calculateTowPrice, reviewTowPrice, HOOKUP_FEE, PER_MILE, VEHICLE_SURCHARGE, NON_ROLLING_SURCHARGE, AFTER_HOURS_SURCHARGE } from '../lib/bookingPrice';
import { BookingValidationError, validateBooking, validationMessage } from '../lib/bookingValidation';
import PickupPinMap from './PickupPinMap';
import { SPANISH } from './spanish';
import { useEffect, useMemo, useRef, useState } from 'react';
const REFERRAL_PARTNERS = {
  'jo-towing': 'Jo Towing',
  'xpress-towing': 'Xpress Towing',
  'j-jasmine-towing': 'J-Jasmine Towing',
  'jasmine-towing': 'Jasmine Towing',
};
/* GOOGLE MAPS LOADER */

let googleMapsPromise = null;

function loadGoogleMaps(apiKey) {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps requires a browser.'));
  }

  if (!apiKey) {
    return Promise.reject(
      new Error('Google Maps browser key is missing.')
    );
  }

  if (window.google?.maps?.importLibrary) {
    return Promise.resolve(window.google);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const callbackName = '__towTruckGoogleMapsReady';

    window[callbackName] = () => {
      if (window.google?.maps?.importLibrary) {
        resolve(window.google);
      } else {
        googleMapsPromise = null;

        reject(
          new Error(
            'Google Maps loaded, but the Maps JavaScript API is unavailable.'
          )
        );
      }

      delete window[callbackName];
    };

    const oldScript = document.getElementById('google-maps-script');

    if (oldScript) {
      oldScript.remove();
    }

    const script = document.createElement('script');

    script.id = 'google-maps-script';

    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      `&v=weekly&loading=async&libraries=places&callback=${callbackName}`;

    script.async = true;

    script.onerror = () => {
      googleMapsPromise = null;
      delete window[callbackName];

      reject(
        new Error(
          'Google Maps JavaScript failed to load. Check the browser API key.'
        )
      );
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

/* ADDRESS AUTOCOMPLETE */

function AddressInput({
  label,
  placeholder,
  value,
  onChange,
  placesReady,
  onPlacesError,
  t = (text) => text,
  locale = "en",
  locationBias,
  onAddressFocus,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);

  const requestId = useRef(0);
  const skipNextSearch = useRef(false);

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      setSuggestions([]);
      setOpen(false);
      return;
    }

    if (!placesReady || value.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      const id = ++requestId.current;

      try {
        const placesLibrary =
          await window.google.maps.importLibrary('places');

        const {
          AutocompleteSuggestion,
          AutocompleteSessionToken,
        } = placesLibrary;

        if (!AutocompleteSuggestion) {
          throw new Error(
            'Google Places autocomplete is unavailable.'
          );
        }

        let token = sessionToken;

        if (!token && AutocompleteSessionToken) {
          token = new AutocompleteSessionToken();
          setSessionToken(token);
        }

        const request = {
          input: value.trim(),
          includedRegionCodes: ['us'],
          language: "en",
          region: "us",
          ...(locationBias ? { locationBias } : {}),
        };

        if (token) {
          request.sessionToken = token;
        }

        const response =
          await AutocompleteSuggestion.fetchAutocompleteSuggestions(
            request
          );

        if (id !== requestId.current) return;

        const results = response?.suggestions || [];

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
        onPlacesError('');
      } catch (error) {
        console.error('Google Places error:', error);

        setSuggestions([]);
        setOpen(false);

        onPlacesError(
          locale === "es" ? t("Google address suggestions could not load.") : error?.message || "Google address suggestions could not load."
        );
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value, placesReady, sessionToken, onPlacesError, locale, locationBias]);

  function choose(item) {
    requestId.current += 1;
    skipNextSearch.current = true;

    setSuggestions([]);
    setOpen(false);
    setSessionToken(null);

    onChange(item.text);
  }

  return (
    <div className="addressField">
      <label>{label}</label>

      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          onAddressFocus?.();
          if (suggestions.length > 0) {
            setOpen(true);
          }
        }}
        onBlur={() => {
          setTimeout(() => setOpen(false), 150);
        }}
        placeholder={placeholder}
        maxLength={500}
        required
        autoComplete="off"
      />

      {open && suggestions.length > 0 && (
        <div
          className="addressSuggestions"
          role="listbox"
        >
          {suggestions.map((item, index) => (
            <button
              key={`${item.text}-${index}`}
              type="button"
              className="addressSuggestion"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(item)}
            >
              <span>{item.text}</span>
            </button>
          ))}

          <div className="googleAttribution">
            Powered by Google
          </div>
        </div>
      )}
    </div>
  );
}

/* MAIN PAGE */

export default function TowBooking({ locale = "en" }) {
  const isSpanish = locale === "es";
  const t = (text) => isSpanish ? (SPANISH[text] || text) : text;
  const [languageHref, setLanguageHref] = useState(isSpanish ? "/" : "/es");
  useEffect(() => {
    document.documentElement.lang = locale;
    setLanguageHref(`${isSpanish ? "/" : "/es"}${window.location.search}`);
  }, [locale, isSpanish]);
  const [locationBias, setLocationBias] = useState(null);
  const locationRequested = useRef(false);

  function requestLocationOnce() {
    if (locationRequested.current || !navigator.geolocation) return;
    locationRequested.current = true;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocationBias({
          center: { lat: coords.latitude, lng: coords.longitude },
          radius: 30000,
        });
      },
      () => {
        // Keep address entry available; Google retains its default IP bias.
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }

  const [leadSource, setLeadSource] = useState('Direct');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [pickupPin, setPickupPin] = useState(null);
  const [draftPin, setDraftPin] = useState(null);
  const [pinAccuracy, setPinAccuracy] = useState(null);
  const [pinBusy, setPinBusy] = useState(false);
  const [pinError, setPinError] = useState('');

  function locatePickup() {
    setPinError('');
    if (!navigator.geolocation) {
      setPinError(isSpanish ? 'Tu navegador no permite obtener la ubicación. Escribe una dirección o un punto de referencia.' : 'Location is unavailable in this browser. Enter an address or landmark instead.');
      return;
    }
    setPinBusy(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setDraftPin({ lat: coords.latitude, lng: coords.longitude });
        setPinAccuracy(Math.round(coords.accuracy));
        setLocationBias({ center: { lat: coords.latitude, lng: coords.longitude }, radius: 30000 });
        setRoute(null);
        setShowQuote(false);
        setPinBusy(false);
      },
      (error) => {
        setPinBusy(false);
        setPinError(isSpanish
          ? (error.code === 1 ? 'Permite el acceso a tu ubicación o escribe una dirección.' : 'No se pudo obtener tu ubicación. Inténtalo de nuevo o escribe una dirección.')
          : (error.code === 1 ? 'Allow location access or type an address instead.' : 'Could not get your location. Try again or type an address.'));
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }

  function confirmPickupPin() {
    setPickupPin(draftPin);
    setPickup(`GPS: ${draftPin.lat.toFixed(6)}, ${draftPin.lng.toFixed(6)}`);
    setDraftPin(null);
    setRoute(null);
    setShowQuote(false);
  }

  const [vehicle, setVehicle] = useState('Sedan');
  const [rolls, setRolls] = useState('Yes');

  const [timing, setTiming] = useState('ASAP');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const serverClockOffset = useRef(0);
  const [asapAfterHours, setAsapAfterHours] = useState(() => {
    const current = centralNow();
    return isAfterHoursCentral(current.date, current.time);
  });

  function currentAsapHours() {
    const current = centralNow(new Date(Date.now() + serverClockOffset.current));
    return isAfterHoursCentral(current.date, current.time);
  }

  function priceChangeMessage(total) {
    return isSpanish
      ? `Cambió el horario de servicio. Tu precio actualizado es $${total}. Revisa el importe y pulsa SOLICITAR MI GRÚA otra vez para confirmarlo. Todavía no se ha enviado la solicitud.`
      : `Service hours changed. Your updated price is $${total}. Review it and press REQUEST MY TOW again to confirm. Your request has not been sent yet.`;
  }

  const [route, setRoute] = useState(null);
  const [routeError, setRouteError] = useState('');
  const [loadingRoute, setLoadingRoute] = useState(false);

  const [showQuote, setShowQuote] = useState(false);
  const [booked, setBooked] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestError, setRequestError] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [smsConsent, setSmsConsent] = useState(false);
  const [vehicleDetails, setVehicleDetails] = useState('');

  const [placesReady, setPlacesReady] = useState(false);
  const [placesError, setPlacesError] = useState('');
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');

  if (ref && REFERRAL_PARTNERS[ref]) {
    setLeadSource(REFERRAL_PARTNERS[ref]);
    localStorage.setItem('towReferralSource', REFERRAL_PARTNERS[ref]);
  } else {
    const savedSource = localStorage.getItem('towReferralSource');
    if (savedSource) {
      setLeadSource(savedSource);
    }
  }
}, []);
  useEffect(() => {
    let active = true;

    const key =
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!key) {
      setPlacesError(
        t("Address suggestions are not configured yet.")
      );

      return;
    }

    async function startGoogle() {
      try {
        const google = await loadGoogleMaps(key);

        await google.maps.importLibrary('places');

        if (!active) return;

        setPlacesReady(true);
        setPlacesError('');
      } catch (error) {
        console.error(
          'Google Maps initialization error:',
          error
        );

        if (!active) return;

        setPlacesReady(false);

        setPlacesError(
          locale === "es" ? t("Google address suggestions could not load.") : error?.message || "Google address suggestions could not load."
        );
      }
    }

    startGoogle();

    return () => {
      active = false;
    };
  }, []);

  const afterHours = timing === 'Schedule for later'
    ? isAfterHoursCentral(scheduledDate, scheduledTime)
    : asapAfterHours;

  const quote = useMemo(() => calculateTowPrice({
    billedMiles: route?.billedMiles, vehicle, rolls, afterHours,
  }), [route, vehicle, rolls, afterHours]);

  function bookingInput() {
    return {
      locale, customerName, customerPhone, vehicleDetails, pickup,
      pickupCoordinates: pickupPin, destination: dropoff, total: quote,
      miles: route?.exactMiles, vehicleType: vehicle, rolls,
      nonRolling: rolls === 'No', timing, smsConsent, leadSource,
      quotedAfterHours: afterHours,
      scheduledDate: timing === 'ASAP' ? '' : scheduledDate,
      scheduledTime: timing === 'ASAP' ? '' : scheduledTime,
      timeZone: 'America/Chicago',
      when: timing === 'ASAP' ? 'ASAP' : `${scheduledDate} ${scheduledTime}`,
    };
  }

  function checkBooking(requireContact) {
    return validateBooking(bookingInput(), { requireContact }).booking;
  }

  async function getQuote(e) {
    e.preventDefault();

    setRouteError('');
    setBooked(false);
    setRequestSubmitted(false);
    setShowQuote(false);

    try {
      checkBooking(false);
    } catch (error) {
      setRouteError(error instanceof BookingValidationError ? validationMessage(error, locale) : error.message);
      return;
    }

    if (draftPin) {
      setRouteError(isSpanish ? 'Confirma el pin de recogida antes de cotizar.' : 'Confirm your pickup pin before getting a quote.');
      return;
    }

    setLoadingRoute(true);

    try {
      const response = await fetch(
        '/api/route-distance',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            locale,
            origin: pickup,
            originCoordinates: pickupPin,
            destination: dropoff,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        if (data.errorCode === 'pickup_hours_changed' && typeof data.afterHours === 'boolean') {
          const serverTime = Date.parse(data.evaluatedAt);
          if (Number.isFinite(serverTime)) serverClockOffset.current = serverTime - Date.now();
          setAsapAfterHours(data.afterHours);
          const updatedTotal = calculateTowPrice({ billedMiles: route?.billedMiles, vehicle, rolls, afterHours: data.afterHours });
          setRequestError(priceChangeMessage(updatedTotal));
          return;
        }
        if (data.errorCode) {
          setRouteError(data.error);
          return;
        }
        throw new Error(
          data.error ||
            'Could not calculate route.'
        );
      }

      setRoute(data);
      if (timing === 'ASAP') setAsapAfterHours(currentAsapHours());
      setShowQuote(true);
    } catch (error) {
      setRouteError(
        isSpanish ? t(error?.message) === error?.message ? t("Could not calculate route.") : t(error?.message) : error?.message || "Could not calculate route."
      );
    } finally {
      setLoadingRoute(false);
    }
  }

  async function submitTowRequest(e) {
    e.preventDefault();
    setRequestError('');
    let validatedBooking;
    try {
      validatedBooking = checkBooking(true);
    } catch (error) {
      setRequestError(error instanceof BookingValidationError ? validationMessage(error, locale) : error.message);
      return;
    }
    if (timing === 'ASAP') {
      const freshAfterHours = currentAsapHours();
      const review = reviewTowPrice(quote, {
        billedMiles: route?.billedMiles, vehicle, rolls, afterHours: freshAfterHours,
      });
      setAsapAfterHours(freshAfterHours);
      if (review.needsConfirmation) {
        setRequestError(priceChangeMessage(review.total));
        return;
      }
      validatedBooking.quotedAfterHours = freshAfterHours;
    }
    setSendingRequest(true);

    try {
      const response = await fetch('/api/send-tow-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedBooking),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errorCode === 'pickup_hours_changed' && typeof data.afterHours === 'boolean') {
          const serverTime = Date.parse(data.evaluatedAt);
          if (Number.isFinite(serverTime)) serverClockOffset.current = serverTime - Date.now();
          setAsapAfterHours(data.afterHours);
          const updatedTotal = calculateTowPrice({ billedMiles: route?.billedMiles, vehicle, rolls, afterHours: data.afterHours });
          setRequestError(priceChangeMessage(updatedTotal));
          return;
        }
        if (data.errorCode) {
          setRequestError(data.error);
          return;
        }
        throw new Error(
          data.error || 'Could not send your tow request.'
        );
      }
if (typeof window !== 'undefined' && window.gtag) {
  window.gtag('event', 'conversion', {
    send_to: 'AW-18487849737/r7DCCNP3jY0dEInm2o9E',
    value: 1.0,
    currency: 'USD',
  });
}
      setRequestSubmitted(true);
    } catch (error) {
      console.error('Tow request submission error:', error);
      setRequestError(
        isSpanish ? t("Could not send your tow request. Please try again.") : error?.message || "Could not send your tow request. Please try again."
      );
    } finally {
      setSendingRequest(false);
    }
  }

  return (
    <main lang={locale}>
      <header className="nav">
   <a href={isSpanish ? "/es" : "/"} className="brand">
  <span className="brandTop">
    TowTruck
  </span>

  <span className="brandBottom">
    OnDemand
  </span>
</a>
        <a href={languageHref} hrefLang={isSpanish ? "en" : "es"} className="callLink" style={{ marginLeft: "auto", marginRight: 18 }}>{isSpanish ? "English" : "Español"}</a>
        <a
          className="callLink"
          href="tel:+12108062061"
        >{t("Call us")}</a>
      </header>

      <section className="hero">
        <div className="heroCopy">
<div className="heroFleet heroFleetDesktop">  <img
    src="/tow-truck-fleet.png"
    alt="Local Tow Truck On Demand fleet"
  />
</div>
        <div className="eyebrow">{t("SERVING DFW & SURROUNDING AREAS")}</div>

          <h1>{t("Need a tow?")}</h1>

          <p className="lede">{t("Enter your pickup and destination, see your price, and request service online.")}</p>

          <div className="trustRow">
            <span>{t("Upfront pricing")}</span>
            <span>{t("Online booking")}</span>
            <span>{t("Local trucks")}</span>
          </div>
        </div>

        <div className="bookingCard">

          {!booked ? (
            <form onSubmit={getQuote}>

              <div className="stepTitle">{t("Get your towing price")}</div>

              <AddressInput
                onAddressFocus={requestLocationOnce}
                locationBias={locationBias}
                t={t}
                locale={locale}
                label={t("Pickup location")}
                placeholder={t("Start typing the pickup address")}
                value={pickup}
                placesReady={placesReady}
                onPlacesError={setPlacesError}
                onChange={(value) => {
                  setPickup(value);
                  setPickupPin(null);
                  setDraftPin(null);
                  setPinError('');
                  setRoute(null);
                  setShowQuote(false);
                }}
              />

              <div style={{ margin: '8px 0 18px' }}>
                <button type="button" onClick={locatePickup} disabled={pinBusy} style={{ display: 'inline-block', width: 'auto', padding: '4px 0', border: 0, borderRadius: 0, background: 'transparent', color: '#0759cc', fontSize: 14, fontWeight: 400, lineHeight: 1.5, textAlign: 'left', textDecoration: 'underline', cursor: pinBusy ? 'wait' : 'pointer' }}>
                  {pinBusy
                    ? (isSpanish ? 'Buscando tu ubicación…' : 'Finding your location…')
                    : (isSpanish ? 'Usar mi ubicación actual' : 'Use my current location')}
                </button>
                {pinError && <p role="alert" className="errorBox">{pinError}</p>}
                {draftPin && (
                  <div style={{ marginTop: 12 }}>
                    {placesReady
                      ? <PickupPinMap initialPin={draftPin} onMove={setDraftPin} isSpanish={isSpanish} />
                      : <p>{isSpanish ? 'Mapa no disponible. Puedes confirmar las coordenadas del GPS.' : 'Map unavailable. You can confirm the GPS coordinates.'}</p>}
                    <p className="finePrint">
                      {draftPin.lat.toFixed(6)}, {draftPin.lng.toFixed(6)}
                      {pinAccuracy !== null && ` · ${isSpanish ? 'Precisión inicial del GPS' : 'Initial GPS accuracy'}: ±${pinAccuracy} m`}
                    </p>
                    <button type="button" className="bookButton" onClick={confirmPickupPin}>{isSpanish ? 'Confirmar este lugar de recogida' : 'Confirm this pickup pin'}</button>
                    <button type="button" className="bookButton" onClick={() => setDraftPin(null)}>{isSpanish ? 'Cancelar' : 'Cancel'}</button>
                  </div>
                )}
                {pickupPin && !draftPin && (
                  <p role="status">
                    {isSpanish ? 'Pin de recogida confirmado.' : 'Pickup pin confirmed.'}{' '}
                    <button type="button" onClick={() => { setDraftPin(pickupPin); setRoute(null); setShowQuote(false); }} style={{ display: 'inline', padding: 0, margin: 0, border: 0, background: 'transparent', color: '#0759cc', fontSize: 'inherit', fontWeight: 400, textDecoration: 'underline', cursor: 'pointer' }}>{isSpanish ? 'Ajustar pin' : 'Adjust pin'}</button>
                  </p>
                )}
              </div>

              <AddressInput
                onAddressFocus={requestLocationOnce}
                locationBias={locationBias}
                t={t}
                locale={locale}
                label={t("Drop-off location")}
                placeholder={t("Start typing the destination")}
                value={dropoff}
                placesReady={placesReady}
                onPlacesError={setPlacesError}
                onChange={(value) => {
                  setDropoff(value);
                  setRoute(null);
                  setShowQuote(false);
                }}
              />

              {placesError && (
                <div className="placesNotice">
                  {t('Address suggestions:')}{' '}
                  {placesError}
                </div>
              )}

              <div className="twoCol">

                <div>
                  <label>{t("Vehicle type")}</label>

                  <select
                    required
                    value={vehicle}
                    onChange={(e) =>
                      setVehicle(
                        e.target.value
                      )
                    }
                  >
                    <option value="Sedan">{t("Sedan")}</option>
                    <option value="SUV">{t("SUV")}</option>
                    <option value="Pickup">{isSpanish ? "Camioneta pickup" : "Pickup"}</option>
                  </select>
                </div>

                <div>
                  <label>{t("Does it roll?")}</label>

                  <select
                    value={rolls}
                    onChange={(e) =>
                      setRolls(
                        e.target.value
                      )
                    }
                  >
                    <option value="Yes">{t("Yes")}</option>
                    <option value="No">{t("No")}</option>
                  </select>
                </div>

              </div>

              <label>{t("When?")}</label>

              <select
                value={timing}
                onChange={(e) =>
                  setTiming(
                    e.target.value
                  )
                }
              >
                <option value="ASAP">{t("ASAP")}</option>
                <option value="Schedule for later">{t("Schedule for later")}</option>
              </select>

              {timing ===
                'Schedule for later' && (
                <div className="twoCol scheduleRow">

                  <div>
                    <label>{t("Pickup date")}</label>

                    <input
                      type="date"
                      required
                      min={centralNow().date}
                      value={
                        scheduledDate
                      }
                      onChange={(e) =>
                        setScheduledDate(
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div>
                    <label>{isSpanish ? "Hora de recogida (hora del centro)" : "Pickup time (Central Time)"}</label>

                    <input
                      type="time"
                      required
                      value={
                        scheduledTime
                      }
                      onChange={(e) =>
                        setScheduledTime(
                          e.target.value
                        )
                      }
                    />
                  </div>

                </div>
              )}

              <button
                className="primary"
                type="submit"
                disabled={loadingRoute}
              >
                {loadingRoute
                  ? t("CALCULATING ROUTE...")
                  : t("GET MY PRICE")}
              </button>

              {routeError && (
                <div className="errorBox" role="alert">
                  {routeError}
                </div>
              )}

              {showQuote &&
                quote !== null && (
                  <div className="quoteArea">

                    <div className="routeInfo">

                      <span>
                        {t('Driving distance:')}{' '}
                        <strong>
                          {route.exactMiles}{' '}
                          mi
                        </strong>
                      </span>

                      <span>
                        {t('Billed mileage:')}{' '}
                        <strong>
                          {route.billedMiles}{' '}
                          mi
                        </strong>
                      </span>

                    </div>

                    <div className="quoteBox">

                      <div>
                        <div className="quoteLabel">{t("Your tow price")}</div>

                        <div className="quotePrice">
                          ${quote}
                        </div>
                      </div>

                      <button
                        className="bookButton"
                        type="button"
                        onClick={() => {
                          try {
                            checkBooking(false);
                          } catch (error) {
                            setRouteError(error instanceof BookingValidationError ? validationMessage(error, locale) : error.message);
                            return;
                          }
                          setRequestSubmitted(false);
                          setBooked(true);
                        }}
                      >{t("BOOK THIS TOW")}</button>

                    </div>

                    <details className="breakdown">

                      <summary>{t("Price breakdown")}</summary>

                      <div>
                        <span>{t("Hookup")}</span>
                        <strong>
                          ${HOOKUP_FEE}
                        </strong>
                      </div>

                      <div>
                        <span>
                          {route.billedMiles}{' '}
                          mi × ${PER_MILE}
                        </span>

                        <strong>
                          $
                          {route.billedMiles *
                            PER_MILE}
                        </strong>
                      </div>

                      {VEHICLE_SURCHARGE[
                        vehicle
                      ] > 0 && (
                        <div>
                          <span>
                            {vehicle === 'Pickup' && isSpanish ? 'Camioneta pickup' : t(vehicle)}{' '}
                            {t('surcharge')}
                          </span>

                          <strong>
                            +$
                            {
                              VEHICLE_SURCHARGE[
                                vehicle
                              ]
                            }
                          </strong>
                        </div>
                      )}

                      {rolls === 'No' && (
                        <div>
                          <span>{t("Doesn't roll")}</span>

                          <strong>
                            +$
                            {
                              NON_ROLLING_SURCHARGE
                            }
                          </strong>
                        </div>
                      )}

                      {afterHours && (
                        <div>
                          <span>{t("After-hours")}</span>

                          <strong>
                            +$
                            {
                              AFTER_HOURS_SURCHARGE
                            }
                          </strong>
                        </div>
                      )}

                      <div>
                        <span>{t("Minimum charge")}</span>

                        <strong>
                          ${MINIMUM_CHARGE}
                        </strong>
                      </div>

                    </details>

                  </div>
                )}

              <p className="finePrint">{t("Business hours: Monday\u2013Saturday, 8:00 AM\u20136:00 PM. Sunday and outside business hours add $60. Mileage is rounded up to the next whole mile.")}</p>

            </form>
          ) : !requestSubmitted ? (

            <form onSubmit={submitTowRequest}>

              <div className="stepTitle">{t("Almost done")}</div>

              <div className="quoteBox">
                <div>
                  <div className="quoteLabel">{t("Your tow price")}</div>

                  <div className="quotePrice">
                    ${quote}
                  </div>
                </div>
              </div>

              <div className="summary">

                <div>
                  <span>{isSpanish ? 'Recogida solicitada · hora del centro' : 'Requested pickup · Central Time'}</span>
                  <strong>{timing === 'ASAP' ? t('ASAP') : `${scheduledDate} ${scheduledTime}`}</strong>
                </div>

                <div>
                  <span>{t("Pickup")}</span>
                  <strong>
                    {pickup}
                  </strong>
                </div>

                <div>
                  <span>{t("Destination")}</span>
                  <strong>
                    {dropoff}
                  </strong>
                </div>

              </div>

              <label>{t("Name")}</label>

              <input
                type="text"
                maxLength={100}
                value={customerName}
                onChange={(e) =>
                  setCustomerName(
                    e.target.value
                  )
                }
                placeholder={t("Your name")}
                autoComplete="name"
                required
              />

              <label>{t("Phone number")}</label>

              <input
                type="tel"
                maxLength={40}
                value={customerPhone}
                onChange={(e) =>
                  setCustomerPhone(
                    e.target.value
                  )
                }
                placeholder={t("Your mobile number")}
                autoComplete="tel"
                required
              />

              <label>{t("Vehicle make & model")}</label>

              <input
                type="text"
                maxLength={200}
                value={vehicleDetails}
                onChange={(e) =>
                  setVehicleDetails(
                    e.target.value
                  )
                }
                placeholder={t("Example: Ford F-150")}
                required
              />

              <div style={{ margin: '14px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={smsConsent}
                    onChange={(e) => setSmsConsent(e.target.checked)}
                    style={{ width: 18, height: 18, flexShrink: 0, margin: 0 }}
                  />
                  <span>{t("Text me my booking confirmation.")}</span>
                </label>
                <p style={{ fontSize: 11, opacity: 0.75, margin: '6px 0 0 27px', lineHeight: 1.5 }}>{t("TowTruckOnDemand: One confirmation text per request. Msg & data rates may apply. Reply STOP to opt out or HELP for help.")}</p>
              </div>

              <p className="finePrint">{t("Pay at pickup: cash, card, Zelle or Cash App.")}</p>

              <button
                className="primary"
                type="submit"
                disabled={sendingRequest}
              >
                {sendingRequest
                  ? t("SENDING REQUEST...")
                  : `${isSpanish ? "SOLICITAR MI GRÚA" : "REQUEST MY TOW"} — $${quote}`}
              </button>

              {requestError && (
                <div className="errorBox" role="alert">
                  {requestError}
                </div>
              )}

              <button
                className="bookButton"
                type="button"
                onClick={() =>
                  setBooked(false)
                }
              >{t("\u2190 BACK TO QUOTE")}</button>


            </form>

          ) : (

            <div className="confirmation">

              <div className="check">
                ✓
              </div>

              <h2>{t("Tow request received")}</h2>

              <p>{t("We’ll contact you to confirm availability and pickup time before dispatch.")}</p>

              <div className="summary">

                <div>
                  <span>{isSpanish ? 'Horario · hora del centro' : 'Timing · Central Time'}</span>

                  <strong>
                    {timing === 'ASAP'
                      ? t("ASAP")
                      : `${scheduledDate} ${scheduledTime}`}
                  </strong>
                </div>

                <div>
                  <span>{t("Name")}</span>
                  <strong>
                    {customerName}
                  </strong>
                </div>

                <div>
                  <span>{t("Phone")}</span>
                  <strong>
                    {customerPhone}
                  </strong>
                </div>

                <div>
                  <span>{t("Vehicle")}</span>
                  <strong>
                    {vehicleDetails}
                  </strong>
                </div>

                <div>
                  <span>{t("Pickup")}</span>
                  <strong>
                    {pickup}
                  </strong>
                </div>

                <div>
                  <span>{t("Destination")}</span>
                  <strong>
                    {dropoff}
                  </strong>
                </div>

                <div>
                  <span>{t("Distance")}</span>
                  <strong>
                    {route?.exactMiles}{' '}
                    mi (
                    {route?.billedMiles}{' '}
                    {t("billed)")}
                  </strong>
                </div>

                <div>
                  <span>{t("Vehicle type")}</span>
                  <strong>
                    {vehicle === "Pickup" && isSpanish ? "Camioneta pickup" : t(vehicle)}
                  </strong>
                </div>

                <div>
                  <span>{t("Rolls")}</span>
                  <strong>
                    {t(rolls)}
                  </strong>
                </div>

                <div>
                  <span>{t("Price")}</span>
                  <strong>
                    ${quote}
                  </strong>
                </div>

              </div>

              <button
                className="primary"
                onClick={() => {
                  setBooked(false);
                  setRequestSubmitted(false);
                  setShowQuote(false);
                  setRoute(null);

                  setPickup('');
                  setPickupPin(null);
                  setDraftPin(null);
                  setPinAccuracy(null);
                  setPinError('');
                  setDropoff('');

                  setCustomerName('');
                  setCustomerPhone('');
                  setSmsConsent(false);
                  setVehicleDetails('');
                }}
              >{t("START ANOTHER")}</button>

            </div>
          )}

        </div>
      </section>

      <section className="how">

        <div className="sectionKicker">{t("HOW IT WORKS")}</div>

        <h2>{t("Book a tow in three simple steps.")}</h2>

        <div className="steps">

          <article>
            <div className="num">
              1
            </div>

            <h3>{t("Enter locations")}</h3>

            <p>{t("Start typing and choose the pickup and destination addresses.")}</p>
          </article>

          <article>
            <div className="num">
              2
            </div>

            <h3>{t("See your price")}</h3>

            <p>{t("We calculate the driving route and apply clear towing rates.")}</p>
          </article>

          <article>
            <div className="num">
              3
            </div>

            <h3>{t("Request your tow")}</h3>

            <p>{t("Enter your contact information and submit your tow request.")}</p>
          </article>

        </div>
      </section>

    
<footer>
  <div>
    © {new Date().getFullYear()} Tow Truck On Demand
  </div>
  <div style={{ marginTop: 10 }}>
    <a href="/privacy-policy">{t("Privacy Policy")}</a>
    <span style={{ margin: "0 12px" }}>|</span>
    <a href="/terms">{t("Terms & Conditions")}</a>
  </div>
</footer>


    </main>
  );
}
