'use client';

import { useState } from 'react';
import SiteMenu from './SiteMenu';
import SiteFooter from './SiteFooter';
import { PHONE_HREF } from '../lib/siteContent';
import { trackEvent } from '../lib/analytics';
import { roadsidePrice, vehicleOptions } from '../lib/roadsidePrice';

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
    another: 'Request another service', callHelp: 'Prefer to speak with dispatch?', serviceArea: 'Fort Worth, Arlington and surrounding DFW areas. Availability varies by location.',
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
    another: 'Solicitar otro servicio', callHelp: '¿Prefieres hablar con nosotros?', serviceArea: 'Fort Worth, Arlington y zonas cercanas de DFW. La disponibilidad depende del lugar.',
    noGuarantee: 'En caso de lesiones o peligro inmediato, llama al 911.', backTow: '¿Necesitas una grúa?', towLink: 'Cotiza una grúa al instante',
    invalidService: 'Selecciona un servicio.', error: 'No se pudo enviar tu solicitud. Inténtalo otra vez o llámanos.',
    extra: 'Para cambiar una llanta debes tener un repuesto en buenas condiciones. Para abrir un vehículo debes tener autorización.',
  },
};

export default function RoadsideRequest({ locale = 'en' }) {
  const es = locale === 'es';
  const t = COPY[es ? 'es' : 'en'];
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
  const [error, setError] = useState('');

  const [estimate, setEstimate] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const quoteKey = JSON.stringify({ service, vehicleType, location, coordinates });
  const quote = estimate?.key === quoteKey ? estimate.value : null;
  async function calculate() {
    setError(''); setCalculating(true); setEstimate(null);
    try {
      const res = await fetch('/api/roadside-quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: quoteKey });
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
    if (!quote) return;
    setStatus('sending');
    setError('');
    try {
      const response = await fetch('/api/send-roadside-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotedTotal: quote.total, service, vehicleType: options ? vehicleType : undefined, location, coordinates, name, phone, vehicle, notes, locale }),
      });
      if (response.status === 409) {
        setEstimate(null); setStatus('idle'); setError(es ? 'Vuelve a calcular el precio.' : 'Please calculate your updated price.'); return;
      }
      if (!response.ok) throw new Error('Request could not be delivered');
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
        </div>

        <div className="bookingCard roadsideCard" id="roadside-request">
          {status === 'success' ? (
            <div className="confirmation" role="status">
              <div className="check">✓</div>
              <h2>{t.received}</h2>
              <p>{t.receivedInfo}</p>
              <button type="button" className="primary" onClick={() => {
                setEstimate(null); setStatus('idle'); setService(''); setVehicleType(''); setLocation(''); setCoordinates(null); setName(''); setPhone(''); setVehicle(''); setNotes('');
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
              <input id="roadside-location" value={location} onChange={e => { setLocation(e.target.value); setCoordinates(null); }} placeholder={t.locationPlaceholder} maxLength={300} autoComplete="street-address" required />
              <button type="button" className="roadsideGps" onClick={locate} disabled={finding}>{finding ? t.finding : t.gps}</button>

              <p>{es ? 'Desde el código postal 76028: primeras 10 millas incluidas; 10.1–20 millas +$15; desde 20.1 millas +$50.' : 'From ZIP 76028: first 10 miles included; 10.1–20 miles add $15; 20.1 miles and up add $50.'}</p>
              <button type="button" className="primary" disabled={calculating || finding || selectedPrice == null || location.trim().length < 5} onClick={calculate}>{calculating ? '…' : es ? 'Ver mi precio total' : 'See my total price'}</button>
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
