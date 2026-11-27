'use client';

import { useState, useEffect } from 'react';
import { roadsideHours } from '../lib/roadsideHours';
import SiteMenu from './SiteMenu';
import SiteFooter from './SiteFooter';
import { PHONE_HREF } from '../lib/siteContent';
import { trackEvent } from '../lib/analytics';
import { roadsidePrice, vehicleOptions } from '../lib/roadsidePrice';
import RoadsideAddressInput from './RoadsideAddressInput';

const SERVICES = [
  { id: 'jump_start', en: 'Jump-start', es: 'Paso de corriente', detailEn: 'For a vehicle with a discharged battery', detailEs: 'Para una batería descargada' },
  { id: 'tire_change', en: 'Spare tire change', es: 'Cambio de llanta', detailEn: 'Sedans, SUVs and pickups only. Usable spare required.', detailEs: 'Solo sedanes, SUV y pickups. Se requiere una llanta de repuesto en buen estado.' },
  { id: 'lockout', en: 'Vehicle lockout', es: 'Apertura de vehículo', detailEn: 'Keys locked inside a passenger vehicle', detailEs: 'Llaves dentro de un vehículo de pasajeros' },
  { id: 'fuel_delivery', en: 'Fuel delivery', es: 'Entrega de combustible', detailEn: 'Includes 1 gallon of gas', detailEs: 'Incluye 1 galón de gasolina' },
];

const COPY = {
  en: {
    menu: 'Explore', call: 'Call us', eyebrow: 'ROADSIDE HELP THROUGHOUT DFW',
    title: 'Roadside assistance in Fort Worth & DFW',
    intro: 'Dead battery, flat tire, locked keys or out of fuel? Tell us what happened and where you are. Service prices start at $65. Fuel delivery is $75 including 1 gallon of gas. We confirm availability before dispatch.',
    start: 'Request roadside assistance', service: 'What do you need help with?', location: 'Where is the vehicle?',
    locationPlaceholder: 'Street address, business or nearby intersection',
    gps: 'Use my current location', finding: 'Finding your location…', gpsFailed: 'Location unavailable. Enter an address instead.',
    name: 'Your name', namePlaceholder: 'Full name', phone: 'Mobile phone', phonePlaceholder: 'Phone number',
    vehicle: 'Vehicle make and model', vehiclePlaceholder: 'Example: Toyota Camry',
    notes: 'Helpful details (optional)', notesPlaceholder: 'Parking lot, tire location, fuel type, access details…',
    request: 'REQUEST ROADSIDE ASSISTANCE', sending: 'SENDING REQUEST…',
    priceTitle: 'Service price', priceCopy: 'No online payment required. We confirm availability before dispatch.',
    note: 'Request only — we will confirm service availability before dispatch. Any additional work will be discussed first.',
    received: 'Roadside request received', receivedInfo: 'Your roadside assistance request was received. We will contact you to confirm driver availability. This is not yet a confirmed dispatch.',
    another: 'Request another service', callHelp: 'Prefer to speak with dispatch?', serviceArea: 'We serve locations within 30 driving miles of our dispatch base in Burleson.',
    noGuarantee: 'For emergencies involving injury or immediate danger, call 911.', backTow: 'Need a tow instead?', towLink: 'Get an instant towing price',
    invalidService: 'Choose a roadside service.', error: 'We could not send your request. Please try again or call us.',
    extra: 'Spare tire changes require a serviceable spare. For lockouts, you must be authorized to access the vehicle.',
  },
  es: {
    menu: 'Explorar', call: 'Llámanos', eyebrow: 'ASISTENCIA EN CARRETERA EN DFW',
    title: 'Asistencia en carretera en Fort Worth y DFW',
    intro: '¿Batería descargada, llanta ponchada, llaves dentro del auto o sin gasolina? Dinos qué pasó y dónde estás. Precios desde $65. La entrega de combustible cuesta $75 e incluye 1 galón de gasolina. Confirmaremos la disponibilidad antes de enviar ayuda.',
    start: 'Solicitar asistencia', service: '¿Qué servicio necesitas?', location: '¿Dónde está el vehículo?',
    locationPlaceholder: 'Dirección, negocio o intersección cercana',
    gps: 'Usar mi ubicación actual', finding: 'Buscando tu ubicación…', gpsFailed: 'No se pudo obtener tu ubicación. Escribe una dirección.',
    name: 'Tu nombre', namePlaceholder: 'Nombre completo', phone: 'Número de celular', phonePlaceholder: 'Número de teléfono',
    vehicle: 'Marca y modelo del vehículo', vehiclePlaceholder: 'Ejemplo: Toyota Camry',
    notes: 'Detalles útiles (opcional)', notesPlaceholder: 'Estacionamiento, llanta dañada, tipo de combustible, acceso…',
    request: 'SOLICITAR ASISTENCIA', sending: 'ENVIANDO SOLICITUD…',
    priceTitle: 'Precio del servicio', priceCopy: 'No necesitas pagar en línea. Confirmaremos disponibilidad antes de enviar ayuda.',
    note: 'Solo solicitud: confirmaremos disponibilidad antes de enviar ayuda. Hablaremos contigo antes de cualquier trabajo adicional.',
    received: 'Solicitud de asistencia recibida', receivedInfo: 'Recibimos tu solicitud de asistencia. Te contactaremos para confirmar disponibilidad. Todavía no se ha confirmado el envío de ayuda.',
    another: 'Solicitar otro servicio', callHelp: '¿Prefieres hablar con nosotros?', serviceArea: 'Atendemos ubicaciones a un máximo de 30 millas por carretera desde nuestra base en Burleson.',
    noGuarantee: 'En caso de lesiones o peligro inmediato, llama al 911.', backTow: '¿Necesitas una grúa?', towLink: 'Cotiza una grúa al instante',
    invalidService: 'Selecciona un servicio.', error: 'No se pudo enviar tu solicitud. Inténtalo otra vez o llámanos.',
    extra: 'Para cambiar una llanta debes tener un repuesto en buenas condiciones. Para abrir un vehículo debes tener autorización.',
  },
};

export default function RoadsideRequest({ locale = 'en' }) {
  const es = locale === 'es';
  const t = COPY[es ? 'es' : 'en'];
  const [hours, setHours] = useState(null);
  useEffect(() => {
    const refresh = () => setHours(roadsideHours());
    refresh();
    const timer = setInterval(refresh, 15000);
    window.addEventListener('focus', refresh);
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, []);
  const closedMessage = hours && !hours.open && (es
    ? `Puedes solicitar asistencia ahora. El horario de servicio se reanuda a las ${hours.opensAt}:00 a. m. (hora central). No se enviará ayuda hasta confirmar la disponibilidad.`
    : `You can request service now. Service hours resume at ${hours.opensAt}:00 AM Central. No driver is dispatched until we confirm availability.`);
  const [service, setService] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const options = vehicleOptions(service);
  const typePrompt = es ? 'Selecciona el tipo de vehículo' : 'Select your vehicle type';
  const selectedPrice = roadsidePrice(service, vehicleType);
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [finding, setFinding] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('idle');
  const [requestedAfterHours, setRequestedAfterHours] = useState(false);
  const [error, setError] = useState('');

  const [estimate, setEstimate] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const quoteKey = JSON.stringify({ service, vehicleType, location, coordinates });
  const quote = estimate?.key === quoteKey ? estimate.value : null;
  const outside = estimate?.key === quoteKey && estimate.outside;
  async function calculate() {
    setError(''); setCalculating(true); setEstimate(null);
    try {
      const res = await fetch('/api/roadside-quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: quoteKey });
      if (res.status === 422) { setEstimate({ key: quoteKey, outside: true }); return; }
      if (!res.ok) throw new Error();
      setEstimate({ key: quoteKey, value: await res.json() });
    } catch {
      setError(es ? 'No pudimos calcular la distancia. Revisa la dirección o llámanos.' : 'We could not calculate the distance. Check the address or call us.');
    } finally { setCalculating(false); }
  }
  function locate() {
    if (!navigator.geolocation) { setError(t.gpsFailed); return; }
    setFinding(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const point = { lat: coords.latitude, lng: coords.longitude };
        setCoordinates(point);
        setLocation(`GPS: ${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`);
        setFinding(false);
      },
      () => { setFinding(false); setError(t.gpsFailed); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  async function submit(event) {
    event.preventDefault();
    if (!service) { setError(t.invalidService); return; }
    const currentHours = roadsideHours();
    setHours(currentHours);
    if (!quote) return;
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) {
      setError(es ? 'Ingresa un número de teléfono válido de 10 a 15 dígitos.' : 'Enter a valid phone number with 10 to 15 digits.');
      return;
    }
    setStatus('sending');
    setError('');
    try {
      const response = await fetch('/api/send-roadside-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotedTotal: quote.total, service, vehicleType: options ? vehicleType : undefined, location, coordinates, name, phone, vehicle, notes, locale }),
      });
      if (response.status === 422) { setEstimate({ key: quoteKey, outside: true }); setStatus('idle'); return; }
      if (response.status === 409) {
        setEstimate(null); setStatus('idle'); setError(es ? 'Vuelve a calcular el precio.' : 'Please calculate your updated price.'); return;
      }
      if (!response.ok) {
        if (response.status === 400) {
          setError(es ? 'Revisa el nombre, teléfono, vehículo y ubicación. El teléfono debe tener entre 10 y 15 dígitos.' : 'Check your name, phone number, vehicle and location. Phone numbers must have 10–15 digits.');
        } else if (response.status === 503) {
          setError(es ? 'El sistema de solicitudes no está disponible en este momento. Llámanos para pedir ayuda.' : 'Online requests are temporarily unavailable. Please call us for assistance.');
        } else if (response.status === 502) {
          setError(es ? 'No pudimos entregar la solicitud a nuestro despacho. Llámanos para pedir ayuda.' : 'We could not deliver your request to dispatch. Please call us for assistance.');
        } else {
          setError(es ? 'No se pudo enviar la solicitud. Llámanos o inténtalo otra vez.' : 'Could not send your request. Please call us or try again.');
        }
        setStatus('idle');
        return;
      }
      const result = await response.json();
      setRequestedAfterHours(Boolean(result.afterHoursRequest));
      trackEvent('roadside_request', { language: locale, roadsideService: service });
      setStatus('success');
    } catch {
      setError(t.error);
      setStatus('idle');
    }
  }

  return (
    <main className="roadsidePage" lang={locale}>
      <header className="nav">
        <a href={es ? '/es' : '/'} className="brand" aria-label="Tow Truck On Demand home">
          <span className="brandTop">TowTruck</span><span className="brandBottom">OnDemand</span>
        </a>
        <SiteMenu locale={locale} />
        <a className="callLink languageLink" href={es ? '/roadside-assistance' : '/es/roadside-assistance'}>{es ? 'English' : 'Español'}</a>
        <a className="callLink" href={PHONE_HREF}>{t.call}</a>
      </header>

      <section className="roadsideHero">
        <div className="roadsideCopy">
          <div className="eyebrow">{t.eyebrow}</div>
          <h1>{t.title}</h1>
          <p className="lede">{t.intro}</p>
          <div className="trustRow"><span>{es ? 'Servicio local' : 'Local DFW service'}</span><span>{es ? 'Sin pago en línea' : 'No online payment'}</span></div>
          <p className="roadsideArea">{t.serviceArea}</p>
          <p>{es ? 'Horario de solicitudes: todos los días, de 6 a. m. a medianoche (hora central).' : 'Request hours: daily, 6 AM to midnight (Central).'}</p>
          {closedMessage && <p role="status">{closedMessage}</p>}
        </div>

        <div className="bookingCard roadsideCard" id="roadside-request">
          {status === 'success' ? (
            <div className="confirmation" role="status">
              <div className="check">✓</div>
              <h2>{t.received}</h2>
              <p>{requestedAfterHours ? (es ? 'Recibimos tu solicitud fuera del horario de servicio. Nos pondremos en contacto contigo cuando se reanude el servicio para confirmar disponibilidad. No se ha enviado ningún conductor.' : 'We received your request outside service hours. We will contact you when service resumes to confirm availability. No driver has been dispatched.') : t.receivedInfo}</p>
              <button type="button" className="primary" onClick={() => {
                setRequestedAfterHours(false); setEstimate(null); setStatus('idle'); setService(''); setVehicleType(''); setLocation(''); setCoordinates(null); setName(''); setPhone(''); setVehicle(''); setNotes('');
              }}>{t.another}</button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <h2 className="stepTitle">{t.start}</h2>
              <fieldset className="roadsideFieldset">
                <legend>{t.service}</legend>
                <div className="roadsideServices">
                  {SERVICES.map(item => (
                    <label key={item.id} className={`roadsideChoice ${service === item.id ? 'selected' : ''}`}>
                      <input type="radio" name="roadside-service" value={item.id} checked={service === item.id} onChange={() => { setService(item.id); setVehicleType(''); }} required />
                      <span className="roadsideChoiceTitle">{es ? item.es : item.en}</span>
                      <small>{es ? item.detailEs : item.detailEn}</small>
                      <strong className="roadsideChoicePrice">{vehicleOptions(item.id) ? (es ? 'Desde $' : 'From $') + vehicleOptions(item.id)[0].price : '$' + roadsidePrice(item.id)}</strong>
                    </label>
                  ))}
                </div>
              </fieldset>
              {options && <>
                <label htmlFor="roadside-type">{typePrompt}</label>
                <select id="roadside-type" required value={vehicleType} onChange={e => setVehicleType(e.target.value)}>
                  <option value="">{typePrompt}</option>
                  {options.map(v => <option key={v.id} value={v.id}>{v[locale]} — ${v.price}</option>)}
                </select>
              </>}

              <label htmlFor="roadside-location">{t.location}</label>
              <RoadsideAddressInput id="roadside-location" value={location} onChange={value => { setLocation(value); setCoordinates(null); }} placeholder={t.locationPlaceholder} locale={locale} />
              <button type="button" className="roadsideGps" onClick={locate} disabled={finding}>{finding ? t.finding : t.gps}</button>

              <p>{es ? 'Desde nuestra base en Burleson: primeras 10 millas incluidas; 10.1–20 millas +$15; 20.1–30 millas +$50.' : 'From our Burleson base: first 10 miles included; 10.1–20 miles add $15; 20.1–30 miles add $50.'}</p>
              <button type="button" className="primary" disabled={calculating || finding || selectedPrice == null || location.trim().length < 5} onClick={calculate}>{calculating ? '…' : es ? 'Ver mi precio total' : 'See my total price'}</button>
              {outside && <p role="alert">{es ? 'Fuera de nuestra zona de servicio. No ofrecemos asistencia a más de 30 millas por carretera de nuestra base en Burleson.' : 'Outside our service area. We do not offer roadside assistance beyond 30 driving miles from our Burleson base.'}</p>}
              {quote && <p role="status">{es ? 'Precio base' : 'Base price'}: ${quote.base} + {es ? 'traslado' : 'travel'} ({quote.miles} mi): ${quote.travel}. <strong>Total: ${quote.total}</strong></p>}

              <div className="twoCol">
                <div><label htmlFor="roadside-name">{t.name}</label><input id="roadside-name" value={name} onChange={e => setName(e.target.value)} placeholder={t.namePlaceholder} autoComplete="name" maxLength={100} required /></div>
                <div><label htmlFor="roadside-phone">{t.phone}</label><input id="roadside-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder={t.phonePlaceholder} autoComplete="tel" maxLength={30} required /></div>
              </div>

              <label htmlFor="roadside-vehicle">{t.vehicle}</label>
              <input id="roadside-vehicle" value={vehicle} onChange={e => setVehicle(e.target.value)} placeholder={t.vehiclePlaceholder} maxLength={120} required />
              <label htmlFor="roadside-notes">{t.notes}</label>
              <textarea id="roadside-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder={t.notesPlaceholder} maxLength={500} rows={2} />

              <div className="roadsidePriceNotice">
                <strong>{es ? 'Precio base' : 'Base price'}: {selectedPrice == null ? (options ? typePrompt : (es ? 'Selecciona un servicio' : 'Select a service')) : '$' + selectedPrice}</strong>
                <p>{t.priceCopy}</p>
              </div>

              <button type="submit" className="primary" disabled={!quote || status === 'sending'}>{status === 'sending' ? t.sending : t.request + (quote ? ' — $' + quote.total : '')}</button>
              {closedMessage && <p>{closedMessage}</p>}
              <p className="finePrint">{t.note}</p>
              {error && <p className="errorBox" role="alert">{error}</p>}
            </form>
          )}
        </div>
      </section>
      <section className="roadsideMore">
        <h2>{t.extra}</h2>
        <p>{t.noGuarantee}</p>
        <p>{t.backTow} <a href={es ? '/es#booking' : '/#booking'}>{t.towLink}</a></p>
        <a className="roadsidePhone" href={PHONE_HREF}>{t.call}</a>
      </section>
      <SiteFooter locale={locale} />
    </main>
  );
}
