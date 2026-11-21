'use client';

import { useEffect, useState } from 'react';
import PickupPinMap from '../components/PickupPinMap';

const card = { maxWidth: 540, margin: '32px auto', padding: 24, borderRadius: 20, background: '#fff', border: '1px solid #e5eaf0', boxShadow: '0 12px 40px #0b122014' };
const button = { display: 'block', width: '100%', minHeight: 48, border: 0, borderRadius: 12, background: '#075fe6', color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer', padding: 12 };
const secondary = { ...button, background: '#edf4ff', color: '#064bba' };

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
  return null;
}

function loadMapScript(onReady, onError) {
  if (window.google?.maps?.importLibrary) { onReady(); return () => {}; }
  const id = 'ttod-location-google-map-script';
  let script = document.getElementById(id);
  const callback = '__ttodLocationGoogleReady';
  window[callback] = () => {
    if (window.google?.maps?.importLibrary) onReady();
    else onError();
    delete window[callback];
  };
  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.async = true;
    script.src = 'https://maps.googleapis.com/maps/api/js?key=' +
      encodeURIComponent(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '') +
      '&v=weekly&loading=async&callback=' + callback;
    script.onerror = onError;
    document.head.appendChild(script);
  } else if (window.google?.maps?.importLibrary) {
    onReady();
  }
  return () => { if (window[callback]) delete window[callback]; };
}

export default function LocationShare() {
  const [isSpanish, setIsSpanish] = useState(false);
  const [phone, setPhone] = useState('');
  const [phoneInvalid, setPhoneInvalid] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [pin, setPin] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [busy, setBusy] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [copied, setCopied] = useState(false);
  const [smsOpened, setSmsOpened] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsSpanish(params.get('lang') === 'es');
    const rawPhone = params.get('to');
    if (rawPhone) {
      const parsed = normalizePhone(rawPhone);
      setPhone(parsed || '');
      setPhoneInvalid(!parsed);
    }
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      setMapError(true);
      return;
    }
    return loadMapScript(() => setMapReady(true), () => setMapError(true));
  }, []);

  const words = isSpanish ? {
    title: 'Comparte tu ubicación', intro: '¿No sabes dónde estás? Comparte la ubicación exacta donde debe llegar la grúa.',
    locate: 'Usar mi ubicación actual', locating: 'Buscando tu ubicación…',
    adjust: 'Mueve el mapa para ajustar el pin al lugar correcto. Confirma el lado correcto de la carretera.',
    send: 'Enviar mi ubicación por SMS', copy: 'Copiar enlace de Google Maps', copied: 'Enlace copiado',
    waiting: 'Primero pulsa el botón de ubicación para encontrar tu vehículo.',
    note: 'Pulsa Enviar en Mensajes para compartir tu ubicación con el operador.',
    phone: 'El mensaje estará dirigido al número de tu operador.',
    noPhone: 'Selecciona el contacto de tu operador cuando se abra la aplicación de mensajes.',
    invalidPhone: 'El enlace del operador contiene un número no válido. Solicita otro enlace.',
    denied: 'No se pudo obtener tu ubicación. Habilita el permiso de ubicación y vuelve a intentarlo.',
    unavailable: 'Tu dispositivo no ofrece ubicación GPS.',
    mapError: 'No se pudo cargar el mapa. Comprueba tus coordenadas antes de enviarlas.',
    location: 'Ubicación seleccionada', privacy: 'Esta herramienta no solicita precios ni reserva un servicio.',
    open: 'Después de abrir Mensajes, revisa el destinatario y pulsa Enviar.',
  } : {
    title: 'Share your pickup location', intro: 'Not sure where you are? Share the exact spot where the tow truck should arrive.',
    locate: 'Use my current location', locating: 'Finding your location…',
    adjust: 'Move the map to adjust the pin to the correct pickup spot. Check the correct side of the road.',
    send: 'Text my location', copy: 'Copy Google Maps link', copied: 'Link copied',
    waiting: 'Tap the location button to find your vehicle first.',
    note: 'Tap Send in Messages to share your pickup pin with dispatch.',
    phone: 'The message will be addressed to your dispatcher.',
    noPhone: 'Select your dispatcher conversation when your messaging app opens.',
    invalidPhone: 'This dispatcher link contains an invalid phone number. Please request a new link.',
    denied: 'Could not get your location. Allow location access and try again.',
    unavailable: 'GPS location is not available on this device.',
    mapError: 'The map could not load. Check the GPS coordinates carefully before sharing.',
    location: 'Selected pickup location', privacy: 'This tool does not show prices or book towing service.',
    open: 'After Messages opens, check the recipient and tap Send.',
  };

  function findLocation() {
    setGeoError('');
    setCopied(false);
    setSmsOpened(false);
    if (!navigator.geolocation) { setGeoError(words.unavailable); return; }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPin({ lat: coords.latitude, lng: coords.longitude });
        setAccuracy(Math.round(coords.accuracy));
        setBusy(false);
      },
      () => { setGeoError(words.denied); setBusy(false); },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }

  const mapLink = pin ? 'https://www.google.com/maps?q=' + pin.lat.toFixed(6) + ',' + pin.lng.toFixed(6) : '';
  const message = pin ? (isSpanish ? 'Mi ubicación para la grúa: ' : 'My tow pickup location: ') + mapLink : '';

  function openSms() {
    if (!pin || phoneInvalid) return;
    setSmsOpened(true);
    const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const separator = isiOS ? '&' : '?';
    window.location.href = 'sms:' + phone + separator + 'body=' + encodeURIComponent(message);
  }

  async function copyLink() {
    if (!pin) return;
    try { await navigator.clipboard.writeText(message); setCopied(true); }
    catch { setGeoError(isSpanish ? 'No se pudo copiar. Usa el botón de mensaje de texto.' : 'Copy unavailable. Use the text message button.'); }
  }

  return (
    <main style={{ padding: '12px 16px 54px' }}>
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <strong style={{ color: '#075fe6' }}>TowTruckOnDemand</strong>
          <button type="button" onClick={() => setIsSpanish(!isSpanish)} style={{ border: '1px solid #dce2ea', background: '#fff', borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}>{isSpanish ? 'English' : 'Español'}</button>
        </div>
        <h1 style={{ fontSize: 29, lineHeight: 1.15, marginTop: 24, marginBottom: 10 }}>{words.title}</h1>
        <p style={{ color: '#536072', lineHeight: 1.55 }}>{words.intro}</p>
        {phoneInvalid && <p role="alert" className="errorBox">{words.invalidPhone}</p>}
        {!pin && <button type="button" onClick={findLocation} disabled={busy} style={{ ...button, marginTop: 20 }}>{busy ? words.locating : words.locate}</button>}
        {geoError && <p role="alert" className="errorBox">{geoError}</p>}
        {pin ? (
          <section aria-label={words.location} style={{ marginTop: 20 }}>
            <strong>{words.location}</strong>
            {mapReady ? <PickupPinMap key={accuracy + ':' + (pin ? 'gps' : '')} initialPin={pin} onMove={setPin} isSpanish={isSpanish} /> : <p style={{ color: '#8a5212' }}>{mapError ? words.mapError : (isSpanish ? 'Cargando mapa…' : 'Loading map…')}</p>}
            <p style={{ fontSize: 13, color: '#536072', overflowWrap: 'anywhere' }}>{pin.lat.toFixed(6)}, {pin.lng.toFixed(6)} {accuracy !== null && ' · GPS ±' + accuracy + ' m'}</p>
            <p style={{ fontSize: 13, lineHeight: 1.5 }}>{words.adjust}</p>
            <button type="button" onClick={openSms} disabled={phoneInvalid} style={{ ...button, marginTop: 18 }}>{words.send}</button>
            <p style={{ fontSize: 12, color: '#536072', lineHeight: 1.55 }}>{words.note} {!phone && words.noPhone}</p>
            <button type="button" onClick={copyLink} style={{ ...secondary, marginTop: 10 }}>{copied ? words.copied : words.copy}</button>
            {smsOpened && <p role="status" style={{ color: '#14633c', fontWeight: 700, fontSize: 13 }}>{words.open}</p>}
          </section>
        ) : <p style={{ fontSize: 13, color: '#657084', marginTop: 20 }}>{words.waiting}</p>}
        <p style={{ fontSize: 12, borderTop: '1px solid #e5eaf0', paddingTop: 16, marginTop: 22, color: '#657084' }}>{words.privacy}</p>
      </div>
    </main>
  );
}
