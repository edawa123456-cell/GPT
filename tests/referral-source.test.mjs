import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const component = await readFile(new URL('../app/components/TowBooking.js', import.meta.url), 'utf8');
const partners = component.match(/const REFERRAL_PARTNERS = (\{[\s\S]*?\});/)[1];
const effect = component.match(/useEffect\(\(\) => \{\n  const params = new URLSearchParams\(window.location.search\);([\s\S]*?)\n\}, \[\]\);/)[0];
const run = new Function('window', 'document', 'useEffect', 'setLeadSource', `const REFERRAL_PARTNERS = ${partners}; ${effect}`);
const key = 'towReferralVisit';
const storage = entries => {
  const data = new Map(Object.entries(entries || {}));
  return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: k => data.delete(k) };
};
function visit({ search = '', referrer = '', type = 'navigate', session = storage(), local = storage(), blocked = false } = {}) {
  const window = { location: { search, origin: 'https://www.towtruckondemand.com' }, performance: { getEntriesByType: () => [{ type }] } };
  if (blocked) {
    Object.defineProperty(window, 'localStorage', { get() { throw Error('blocked'); } });
    Object.defineProperty(window, 'sessionStorage', { get() { throw Error('blocked'); } });
  } else Object.assign(window, { localStorage: local, sessionStorage: session });
  let source;
  run(window, { referrer }, fn => fn(), value => { source = value; });
  return { source, session, local };
}

test('old permanent Jo Towing attribution is removed on a direct visit', () => {
  const local = storage({ towReferralSource: 'Jo Towing' });
  assert.equal(visit({ local }).source, 'Direct');
  assert.equal(local.getItem('towReferralSource'), null);
});
test('partner attribution survives internal English/Spanish navigation and reload', () => {
  const { source, session } = visit({ search: '?ref=jo-towing' });
  assert.equal(source, 'Jo Towing');
  assert.equal(visit({ session, referrer: 'https://www.towtruckondemand.com/pricing' }).source, 'Jo Towing');
  assert.equal(visit({ session, type: 'reload' }).source, 'Jo Towing');
});
test('a new direct visit or external arrival clears even an unexpired partner', () => {
  for (const referrer of ['', 'https://www.google.com/']) {
    const { session } = visit({ search: '?ref=jo-towing' });
    assert.equal(visit({ session, referrer }).source, 'Direct');
    assert.equal(session.getItem(key), null);
  }
});
test('expired, corrupt and unknown saved referrals become Direct', () => {
  for (const saved of [JSON.stringify({ ref: 'jo-towing', expiresAt: Date.now() - 1 }), '{broken', JSON.stringify({ ref: 'unknown', expiresAt: Date.now() + 60000 })]) {
    const session = storage({ [key]: saved });
    assert.equal(visit({ session, type: 'reload' }).source, 'Direct');
    assert.equal(session.getItem(key), null);
  }
});
test('explicit unknown referral clears old attribution, and a new partner replaces it', () => {
  const { session } = visit({ search: '?ref=jo-towing' });
  assert.equal(visit({ session, search: '?ref=unknown', type: 'reload' }).source, 'Direct');
  assert.equal(visit({ session, search: '?ref=xpress-towing' }).source, 'Xpress Towing');
});
test('blocked storage does not break booking or explicit partner attribution', () => {
  assert.equal(visit({ blocked: true }).source, 'Direct');
  assert.equal(visit({ blocked: true, search: '?ref=jo-towing' }).source, 'Jo Towing');
});
