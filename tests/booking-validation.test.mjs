import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Import the real shared modules without depending on Next's extension resolver.
const moduleUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const timingUrl = moduleUrl(await readFile(new URL('../app/lib/bookingTiming.js', import.meta.url), 'utf8'));
const validationUrl = moduleUrl((await readFile(new URL('../app/lib/bookingValidation.js', import.meta.url), 'utf8')).replace("'./bookingTiming'", JSON.stringify(timingUrl)));
const { validateBooking, validateLocations, normalizePhone, validationMessage } = await import(validationUrl);
const now = new Date('2026-10-22T18:00:00Z');
const valid = () => ({
  customerName: ' Test Customer ', customerPhone: '(210) 806-2061',
  vehicleDetails: ' Toyota Camry ', pickup: ' 200 Texas St, Fort Worth, TX ',
  destination: ' 1000 Throckmorton St, Fort Worth, TX ', vehicleType: 'Sedan',
  rolls: 'Yes', timing: 'ASAP', when: 'ASAP', total: 150, miles: 10,
});
const validate = (body, options = {}) => validateBooking(body, { now, ...options });
const errorFor = (body, field) => assert.throws(() => validate(body), (error) => error.field === field);

test('valid ASAP request trims fields and leaves SMS optional', () => {
  const { booking, requestedTiming } = validate(valid());
  assert.equal(booking.customerName, 'Test Customer');
  assert.equal(booking.vehicleDetails, 'Toyota Camry');
  assert.equal(booking.customerPhone, '+12108062061');
  assert.equal(booking.smsConsent, false);
  assert.equal(requestedTiming.kind, 'asap');
});

test('plausible domestic and international phone formats', () => {
  for (const phone of ['2108062061', '1-210-806-2061', '+1 (210) 806-2061']) assert.equal(normalizePhone(phone), '+12108062061');
  assert.equal(normalizePhone('+44 20 7946 0958'), '+442079460958');
  assert.equal(normalizePhone('+962 79 123 4567'), '+962791234567');
  for (const phone of ['', '   ', 'abc', '12345', '0000000000', '1111111111', '2108062061abc', '+1210806206', '++442079460958', '+0000000000', '442079460958', 2108062061, null, []]) assert.throws(() => normalizePhone(phone));
});

test('every mandatory booking field rejects missing, blank or wrong-type values', () => {
  for (const field of ['customerName', 'customerPhone', 'vehicleDetails', 'pickup', 'destination', 'vehicleType', 'rolls']) {
    for (const value of [undefined, '', '   ', {}, []]) errorFor({ ...valid(), [field]: value }, field);
  }
  errorFor({ ...valid(), timing: undefined, when: undefined }, 'timing');
  for (const body of [null, [], 'text', 123]) errorFor(body, 'body');
});

test('confirmed GPS pin works without a street address; malformed pins fail', () => {
  const pin = { lat: 29.48, lng: -98.63 };
  const { booking } = validate({ ...valid(), pickup: '', pickupCoordinates: pin });
  assert.equal(booking.pickup, 'GPS: 29.480000, -98.630000');
  assert.deepEqual(booking.pickupCoordinates, pin);
  for (const pickupCoordinates of [{ lat: 91, lng: 0 }, { lat: 29, lng: -181 }, { lat: '29', lng: -98 }, { lat: NaN, lng: 0 }, [], 'pin']) errorFor({ ...valid(), pickupCoordinates }, 'pickup');
});

test('schedule is mandatory only for scheduled requests, with valid future Central time', () => {
  const scheduled = { ...valid(), when: undefined, timing: 'Schedule for later', scheduledDate: '2026-10-23', scheduledTime: '14:30' };
  assert.equal(validate(scheduled).requestedTiming.kind, 'scheduled');
  for (const change of [{ scheduledDate: '' }, { scheduledTime: '' }, { scheduledDate: '2020-01-01' }, { scheduledDate: '2027-02-30' }, { scheduledTime: '25:00' }, { scheduledDate: {} }, { timing: 'Whenever' }]) errorFor({ ...scheduled, ...change }, 'timing');
  assert.equal(validate({ ...valid(), timing: undefined, when: '2026-10-23 14:30' }).requestedTiming.kind, 'scheduled');
  errorFor({ ...valid(), when: '2026-10-23 14:30' }, 'timing');
});

test('quote stage validates route/options without asking for contact details early', () => {
  const { customerName, customerPhone, vehicleDetails, ...quote } = valid();
  assert.doesNotThrow(() => validate(quote, { requireContact: false }));
  assert.throws(() => validate({ ...quote, destination: '   ' }, { requireContact: false }));
});

test('vehicle choices, rolling condition and optional consent have consistent types', () => {
  errorFor({ ...valid(), vehicleType: 'Heavy truck' }, 'vehicleType');
  errorFor({ ...valid(), nonRolling: true }, 'rolls');
  const normalized = validate({ ...valid(), rolls: undefined, nonRolling: true, smsConsent: false }).booking;
  assert.equal(normalized.rolls, 'No');
  assert.equal(normalized.smsConsent, false);
  assert.equal(validate({ ...valid(), smsConsent: true }).booking.smsConsent, true);
  errorFor({ ...valid(), smsConsent: 'yes' }, 'smsConsent');
});

test('text is bounded and supports non-English names', () => {
  assert.equal(validate({ ...valid(), customerName: ' ناصر ' }).booking.customerName, 'ناصر');
  for (const [field, max] of [['customerName', 100], ['vehicleDetails', 200], ['pickup', 500], ['destination', 500]]) errorFor({ ...valid(), [field]: 'a'.repeat(max + 1) }, field);
});

test('locations accept address OR pin; error messages exist in English and Spanish', () => {
  assert.throws(() => validateLocations({ pickup: ' ', destination: 'Dallas' }));
  assert.throws(() => validateLocations({ pickup: 'Fort Worth', destination: ' ' }));
  assert.match(validationMessage({ code: 'customerPhone' }, 'es'), /teléfono/);
  assert.match(validationMessage({ code: 'customerPhone' }, 'en'), /phone/);
});

const storeUrl = moduleUrl(`
export async function saveBooking(payload, requested_timing) { return { id: 'mock', reference: 'TTOD-TEST', payload, requested_timing, notification_status: 'pending', duplicate: false }; }
export async function claimNotification(id, notification_payload) { return { notification_payload, lease_token: 'mock' }; }
export async function finishNotification() {}
`);
async function routeHandler(path) {
  const source = (await readFile(new URL(`../${path}`, import.meta.url), 'utf8'))
    .replace("'../../lib/bookingValidation'", JSON.stringify(validationUrl))
    .replace("'../../lib/bookingStore'", JSON.stringify(storeUrl))
    .replace(/import \{ NextResponse \} from ['"]next\/server['"];?/, 'const NextResponse = { json: (body, init) => Response.json(body, init) };');
  return (await import(moduleUrl(source))).POST;
}
const request = (body) => new Request('https://test.invalid', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('booking endpoint blocks invalid requests before any real or mocked email call', async () => {
  const post = await routeHandler('app/api/send-tow-request/route.js');
  const originalFetch = global.fetch;
  const oldKey = process.env.RESEND_API_KEY, oldTo = process.env.TOW_REQUEST_EMAIL;
  let calls = 0, email;
  process.env.RESEND_API_KEY = 'test'; process.env.TOW_REQUEST_EMAIL = 'test@example.invalid';
  global.fetch = async (url, options) => { calls++; email = JSON.parse(options.body); return Response.json({ id: 'mock' }); };
  try {
    for (const payload of [{}, null, [], { ...valid(), customerPhone: 'bad' }, { ...valid(), customerName: ' ' }, { ...valid(), rolls: '' }]) {
      const response = await post(request(payload)); assert.equal(response.status, 400);
    }
    const malformed = await post(new Request('https://test.invalid', { method: 'POST', body: '{broken' }));
    assert.equal(malformed.status, 400); assert.equal(calls, 0);
    const spanishError = await post(request({ ...valid(), locale: 'es', customerPhone: 'bad' }));
    assert.match((await spanishError.json()).error, /teléfono/); assert.equal(calls, 0);
    assert.equal((await post(request({ ...valid(), smsConsent: false }))).status, 200);
    assert.equal(calls, 1); assert.match(email.html, /\+12108062061/); assert.match(email.subject, /^\[ASAP\]/);
    assert.equal((await post(request({ ...valid(), pickup: '', pickupCoordinates: { lat: 29.48, lng: -98.63 }, timing: 'Schedule for later', when: undefined, scheduledDate: '2099-10-23', scheduledTime: '14:30', rolls: 'No', nonRolling: true }))).status, 200);
    assert.match(email.subject, /^\[SCHEDULED/); assert.match(email.html, /2:30 PM Central Time/); assert.match(email.html, /Non-Rolling:<\/strong>\s*Yes/); assert.match(email.html, /maps\/search/);
  } finally {
    global.fetch = originalFetch;
    if (oldKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = oldKey;
    if (oldTo === undefined) delete process.env.TOW_REQUEST_EMAIL; else process.env.TOW_REQUEST_EMAIL = oldTo;
  }
});

test('route-distance endpoint rejects bad locations before Google is called', async () => {
  const post = await routeHandler('app/api/route-distance/route.js');
  const originalFetch = global.fetch;
  let calls = 0; global.fetch = async () => { calls++; throw new Error('Unexpected Google call'); };
  try {
    for (const payload of [{}, { origin: '  ', destination: 'Dallas' }, { origin: 'Fort Worth', destination: 123 }, { originCoordinates: { lat: 99, lng: 0 }, destination: 'Dallas' }]) assert.equal((await post(request(payload))).status, 400);
    assert.equal(calls, 0);
  } finally { global.fetch = originalFetch; }
});
