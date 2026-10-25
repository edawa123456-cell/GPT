import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const moduleUrl = text => `data:text/javascript;base64,${Buffer.from(text).toString('base64')}`;
const timingUrl = moduleUrl(await source('app/lib/bookingTiming.js'));
const { centralNow, isAfterHoursCentral, readBookingTiming } = await import(timingUrl);
const { calculateTowPrice, reviewTowPrice } = await import(moduleUrl(await source('app/lib/bookingPrice.js')));
const validationUrl = moduleUrl((await source('app/lib/bookingValidation.js')).replace("'./bookingTiming'", JSON.stringify(timingUrl)));
const options = { billedMiles: 10, vehicle: 'Sedan', rolls: 'Yes' };
const hoursAt = now => { const time = centralNow(new Date(now)); return isAfterHoursCentral(time.date, time.time); };

test('ASAP prices refresh at Central opening, closing and Sunday transitions', () => {
  for (const [before, after, oldPrice, newPrice] of [
    ['2026-10-22T22:59:00Z', '2026-10-22T23:01:00Z', 150, 210],
    ['2026-10-23T12:59:00Z', '2026-10-23T13:01:00Z', 210, 150],
    ['2026-10-25T16:00:00Z', '2026-10-26T16:00:00Z', 210, 150],
  ]) {
    assert.equal(calculateTowPrice({ ...options, afterHours: hoursAt(before) }), oldPrice);
    assert.deepEqual(reviewTowPrice(oldPrice, { ...options, afterHours: hoursAt(after) }), { total: newPrice, needsConfirmation: true });
    assert.equal(reviewTowPrice(newPrice, { ...options, afterHours: hoursAt(after) }).needsConfirmation, false);
  }
});
test('refresh recalculates the minimum correctly rather than blindly adding $60', () => {
  const shortTrip = { ...options, billedMiles: 1 };
  assert.equal(calculateTowPrice({ ...shortTrip, afterHours: false }), 100);
  assert.deepEqual(reviewTowPrice(100, { ...shortTrip, afterHours: true }), { total: 147, needsConfirmation: true });
  assert.deepEqual(reviewTowPrice(147, { ...shortTrip, afterHours: false }), { total: 100, needsConfirmation: true });
  assert.equal(calculateTowPrice({ ...options, vehicle: 'SUV', rolls: 'No', afterHours: true }), 265);
});
test('scheduled pickup uses its selected time regardless of current submission hour', () => {
  for (const now of ['2026-10-23T02:00:00Z', '2026-10-23T12:00:00Z']) {
    const timing = readBookingTiming({ timing: 'Schedule for later', scheduledDate: '2026-10-23', scheduledTime: '09:00' }, new Date(now));
    assert.equal(timing.afterHours, false);
    assert.equal(calculateTowPrice({ ...options, afterHours: timing.afterHours }), 150);
  }
});

const component = await source('app/components/TowBooking.js');
const submitSource = component.slice(component.indexOf('  async function submitTowRequest(e) {'), component.indexOf('\n  return (\n    <main'));
const messageSource = component.slice(component.indexOf('  function priceChangeMessage(total) {'), component.indexOf('\n  const [route, setRoute]'));
function clientHarness({ quote = 150, freshAfterHours = true, spanish = false, response } = {}) {
  const state = { calls: 0, error: '', submitted: false, afterHours: false, sending: false, events: [] };
  const env = {
    timing: 'ASAP', route: { billedMiles: 10 }, vehicle: 'Sedan', rolls: 'Yes', quote,
    isSpanish: spanish, locale: spanish ? 'es' : 'en', serverClockOffset: { current: 0 },
    currentAsapHours: () => freshAfterHours, calculateTowPrice, reviewTowPrice,
    bookingEvent: name => state.events.push(name),
    checkBooking: () => ({ total: quote }), BookingValidationError: class extends Error {},
    validationMessage: () => '', setRequestError: value => { state.error = value; },
    setAsapAfterHours: value => { state.afterHours = value; },
    setSendingRequest: value => { state.sending = value; },
    setRequestSubmitted: value => { state.submitted = value; },
    fetch: async (path, init) => { state.calls++; state.payload = JSON.parse(init.body); return response || Response.json({ success: true }); },
  };
  // Execute the actual component handler, with state setters and network isolated.
  const submit = new Function('env', `with (env) { ${messageSource}; return ${submitSource}; }`)(env);
  return { state, env, submit: () => submit({ preventDefault() {} }) };
}
test('customer sees changed total without submission, then explicitly accepts by submitting again', async () => {
  const first = clientHarness(); await first.submit();
  assert.equal(first.state.calls, 0); assert.equal(first.state.submitted, false);
  assert.equal(first.state.afterHours, true); assert.match(first.state.error, /\$210/);
  assert.match(first.state.error, /has not been sent/);
  const confirmation = clientHarness({ quote: 210 }); await confirmation.submit();
  assert.equal(confirmation.state.calls, 1); assert.equal(confirmation.state.payload.total, 210);
  assert.deepEqual(confirmation.state.events, ['booking_attempt', 'generate_lead']);
  assert.deepEqual(first.state.events, []);
  assert.equal(confirmation.state.payload.quotedAfterHours, true); assert.equal(confirmation.state.submitted, true);
  const spanish = clientHarness({ spanish: true }); await spanish.submit();
  assert.match(spanish.state.error, /\$210/); assert.match(spanish.state.error, /Todavía no se ha enviado/);
});
test('server boundary conflict updates displayed price and clock without sending a confirmation', async () => {
  const client = clientHarness({ freshAfterHours: false, response: Response.json({ errorCode: 'pickup_hours_changed', afterHours: true, evaluatedAt: new Date().toISOString() }, { status: 409 }) });
  await client.submit();
  assert.equal(client.state.calls, 1); assert.equal(client.state.submitted, false);
  assert.equal(client.state.afterHours, true); assert.match(client.state.error, /\$210/);
  assert.equal(client.state.sending, false);
  assert.equal(client.state.events.includes('generate_lead'), false);
});

const RealDate = Date;
const fixedNow = '2026-10-22T23:01:00Z';
const routeUrl = moduleUrl((await source('app/api/send-tow-request/route.js'))
  .replace("'../../lib/bookingValidation'", JSON.stringify(validationUrl))
  .replace('import { NextResponse } from "next/server";', 'const NextResponse = { json: (body, init) => Response.json(body, init) };'));
const { POST } = await import(routeUrl);
const valid = { customerName: 'Test Customer', customerPhone: '2108062061', vehicleDetails: 'Toyota Camry', pickup: 'Fort Worth, TX', destination: 'Dallas, TX', vehicleType: 'Sedan', rolls: 'Yes', timing: 'ASAP', when: 'ASAP', total: 150, miles: 10 };
const request = payload => new Request('https://test.invalid', { method: 'POST', body: JSON.stringify(payload) });
test('server rejects timing mismatch before Resend, then emails the accepted price and matching hours', async () => {
  const originalFetch = global.fetch;
  const oldKey = process.env.RESEND_API_KEY, oldTo = process.env.TOW_REQUEST_EMAIL;
  global.Date = class extends RealDate { constructor(...args) { super(...(args.length ? args : [fixedNow])); } static now() { return RealDate.parse(fixedNow); } };
  let calls = 0, email;
  global.fetch = async (path, init) => { calls++; email = JSON.parse(init.body); return Response.json({ id: 'test-email' }); };
  process.env.RESEND_API_KEY = 'test'; process.env.TOW_REQUEST_EMAIL = 'test@example.invalid';
  try {
    const response = await POST(request({ ...valid, quotedAfterHours: false }));
    assert.equal(response.status, 409); assert.equal(calls, 0);
    const conflict = await response.json(); assert.equal(conflict.afterHours, true); assert.equal(conflict.evaluatedAt, fixedNow.replace('Z', '.000Z'));
    const es = await POST(request({ ...valid, locale: 'es', quotedAfterHours: false }));
    assert.match((await es.json()).error, /Revisa/); assert.equal(calls, 0);
    assert.equal((await POST(request({ ...valid, total: 210, quotedAfterHours: true }))).status, 200);
    assert.equal(calls, 1); assert.match(email.html, /Quote: \$210/); assert.match(email.html, /After Hours:<\/strong>\s*Yes/);
    assert.equal((await POST(request({ ...valid, quotedAfterHours: 'false' }))).status, 400); assert.equal(calls, 1);
    assert.equal((await POST(request({ ...valid, timing: 'Schedule for later', when: undefined, scheduledDate: '2026-10-23', scheduledTime: '09:00', quotedAfterHours: false }))).status, 200);
    assert.match(email.html, /9:00 AM Central Time/); assert.match(email.html, /After Hours:<\/strong>\s*No/);
  } finally {
    global.Date = RealDate; global.fetch = originalFetch;
    if (oldKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = oldKey;
    if (oldTo === undefined) delete process.env.TOW_REQUEST_EMAIL; else process.env.TOW_REQUEST_EMAIL = oldTo;
  }
});
