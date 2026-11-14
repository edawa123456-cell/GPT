import { createHmac, timingSafeEqual } from 'node:crypto';

export const PARTNER_COOKIE = 'ttod_partner_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function secret() { return process.env.TTOD_PARTNER_SESSION_SECRET || ''; }
export function configured() {
  return Boolean(process.env.TTOD_PARTNER_ACCESS_CODE && secret().length >= 32);
}
export function safeEqual(a, b) {
  const ah = createHmac('sha256', 'ttod-code-check').update(String(a)).digest();
  const bh = createHmac('sha256', 'ttod-code-check').update(String(b)).digest();
  return timingSafeEqual(ah, bh);
}
function signature(value) { return createHmac('sha256', secret()).update(value).digest('hex'); }
export function createSession() {
  if (!configured()) throw new Error('Partner access not configured');
  const payload = String(Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS);
  return payload + '.' + signature(payload);
}
export function validSession(value) {
  if (!configured() || typeof value !== 'string') return false;
  const [payload, mac, extra] = value.split('.');
  if (extra !== undefined || !/^\d{10,12}$/.test(payload || '') || !/^[a-f0-9]{64}$/.test(mac || '')) return false;
  const now = Math.floor(Date.now() / 1000);
  const expiry = Number(payload);
  if (expiry <= now || expiry > now + MAX_AGE_SECONDS) return false;
  return safeEqual(mac, signature(payload));
}
export const partnerMaxAge = MAX_AGE_SECONDS;
