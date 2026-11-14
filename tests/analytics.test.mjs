import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../app/lib/analytics.js', import.meta.url), 'utf8');
const { analyticsParameters, trackEvent, initializeGoogleTracking, isTrackingExcluded } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('excluded browsers never load Google tags or queue funnel events', () => {
  const scripts = [];
  globalThis.document = { createElement: () => ({}), head: { appendChild: s => scripts.push(s) } };
  globalThis.window = { location: { pathname: '/es' }, localStorage: { getItem: () => '1' } };
  try {
    initializeGoogleTracking();
    assert.equal(isTrackingExcluded(), true);
    assert.equal(trackEvent('generate_lead'), false);
    assert.equal(window.dataLayer, undefined);
    assert.deepEqual(scripts, []);
    window.location.pathname = '/tracking-control';
    window.localStorage.getItem = () => null;
    initializeGoogleTracking();
    assert.deepEqual(scripts, []);
    assert.equal(trackEvent('quote_start'), false);
    window.location.pathname = '/';
    // Execute precisely the standalone function that the layout serializes.
    new Function(`(${initializeGoogleTracking.toString()})()`)();
    assert.equal(scripts.length, 1);
    assert.match(scripts[0].src, /AW-18487849737$/);
    assert.deepEqual(window.dataLayer.slice(1).map(args => Array.from(args)), [
      ['config', 'AW-18487849737'], ['config', 'G-98RWTMRG0V'],
    ]);
    assert.equal(trackEvent('generate_lead'), true);
  } finally { delete globalThis.window; delete globalThis.document; }
});

test('analytics drops customer data, coordinates, URLs and arbitrary error details', () => {
  assert.deepEqual(analyticsParameters({ language: 'es', timing: 'Schedule for later', vehicle: 'SUV', leadSource: 'Jo Towing',
    customerName: 'Private Name', customerPhone: '2105551234', pickup: 'Private address', destination: 'Another address',
    coordinates: { lat: 29.5, lng: -98.5 }, error: 'Address lookup failed for a customer', url: '?phone=private', value: 196 }), {
    send_to: 'G-98RWTMRG0V', site_language: 'es', pickup_timing: 'scheduled', vehicle_type: 'SUV', referral_partner: 'Jo Towing',
  });
  assert.deepEqual(analyticsParameters({ language: 'Private Name', timing: 'Private address', vehicle: 'VIN', leadSource: 'Phone', social: 'URL', depth: 1 }), { send_to: 'G-98RWTMRG0V' });
});
test('analytics works on server, queues before Google loads, and survives blocked tracking', () => {
  assert.equal(trackEvent('generate_lead'), false);
  globalThis.window = { dataLayer: [] };
  try {
    assert.equal(trackEvent('quote_start', { language: 'en' }), true);
    assert.deepEqual(Array.from(window.dataLayer[0]), ['event', 'quote_start', { send_to: 'G-98RWTMRG0V', site_language: 'en' }]);
    const calls = [];
    window.gtag = (...args) => calls.push(args);
    trackEvent('generate_lead', { leadSource: 'Direct', customerName: 'never send' });
    assert.deepEqual(calls, [['event', 'generate_lead', { send_to: 'G-98RWTMRG0V', referral_partner: 'Direct' }]]);
    assert.equal(trackEvent('customer_data', { customerPhone: 'private' }), false);
    window.gtag = () => { throw Error('blocked'); };
    assert.equal(trackEvent('generate_lead'), false);
  } finally { delete globalThis.window; }
});
