import { NextResponse } from 'next/server';
import { roadsidePrice } from '../../lib/roadsidePrice';

const SERVICES = {
  jump_start: 'Jump-start',
  tire_change: 'Spare tire change',
  lockout: 'Vehicle lockout',
  fuel_delivery: 'Fuel delivery (includes 1 gallon of gas)',
};

const clean = (value, max = 200) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

export async function POST(request) {
  try {
    const data = await request.json().catch(() => null);
    if (!data || typeof data !== 'object') return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    const { service } = data;
    const price = roadsidePrice(service);
    const location = clean(data.location, 300);
    const name = clean(data.name, 100);
    const phone = clean(data.phone, 30);
    const vehicle = clean(data.vehicle, 120);
    const notes = clean(data.notes, 500);
    const locale = data.locale === 'es' ? 'es' : 'en';

    if (price === null || location.length < 5 || name.length < 2 ||
        phone.replace(/\D/g, '').length < 10 || phone.replace(/\D/g, '').length > 15 ||
        vehicle.length < 2) {
      return NextResponse.json({ error: 'Please complete the required service, location and contact details.' }, { status: 400 });
    }

    const coords = data.coordinates;
    let mapLink = '';
    if (coords !== null && coords !== undefined) {
      if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number' ||
          !Number.isFinite(coords.lat) || !Number.isFinite(coords.lng) ||
          Math.abs(coords.lat) > 90 || Math.abs(coords.lng) > 180) {
        return NextResponse.json({ error: 'Invalid GPS location.' }, { status: 400 });
      }
      mapLink = 'https://www.google.com/maps/search/?api=1&query=' + coords.lat + ',' + coords.lng;
    }

    if (!process.env.RESEND_API_KEY || !process.env.TOW_REQUEST_EMAIL) {
      console.error('Roadside request email configuration is missing.');
      return NextResponse.json({ error: 'Request notifications are temporarily unavailable.' }, { status: 503 });
    }

    const fields = [
      ['Service', SERVICES[service]],
      ['Quoted roadside service price', '$' + price],
      ['Fuel included', service === 'fuel_delivery' ? '1 gallon of gas included in $75' : 'Not applicable'],
      ['Customer name', name],
      ['Phone', phone],
      ['Location', location],
      ['Vehicle', vehicle],
      ['Details', notes || 'Not provided'],
      ['Site language', locale === 'es' ? 'Spanish' : 'English'],
      ['Dispatch', 'REQUEST ONLY — confirm availability before sending a driver'],
    ];

    const html = '<div style="font-family:Arial,sans-serif;max-width:650px;margin:auto">' +
      '<h1>New Roadside Assistance Request</h1>' +
      '<p style="padding:12px;background:#fff4df"><strong>SERVICE PRICE: $' + price + '. CONFIRM AVAILABILITY BEFORE DISPATCH.</strong></p>' +
      fields.map(([label, value]) => '<p><strong>' + escapeHtml(label) + ':</strong> ' + escapeHtml(value) + '</p>').join('') +
      (mapLink ? '<p><a href="' + mapLink + '">Open customer GPS location in Google Maps</a></p>' : '') +
      '</div>';

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'TowTruckOnDemand <notifications@towtruckondemand.com>',
        to: [process.env.TOW_REQUEST_EMAIL],
        subject: '[ROADSIDE $' + price + '] ' + SERVICES[service] + ' — ' + name.replace(/[\r\n]/g, ' '),
        html,
      }),
    });

    if (!response.ok) {
      console.error('Roadside request email failed:', response.status);
      return NextResponse.json({ error: 'Unable to deliver roadside request.' }, { status: 502 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Roadside request error:', error);
    return NextResponse.json({ error: 'Unable to process roadside request.' }, { status: 500 });
  }
}
