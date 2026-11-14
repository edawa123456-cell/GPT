export const ANALYTICS_ID = 'G-98RWTMRG0V';

export const TEST_EXCLUSION_KEY = 'ttod.excludeTracking';

export function isTrackingExcluded() {
  if (typeof window === 'undefined') return true;
  if (window.location?.pathname === '/tracking-control') return true;
  try { return window.localStorage?.getItem(TEST_EXCLUSION_KEY) === '1'; }
  catch { return false; }
}

// Serialized into the layout. Keep this function self-contained so the check
// runs before either Google's automatic events or its network script starts.
export function initializeGoogleTracking() {
  if (window.location.pathname === '/tracking-control') return;
  try { if (window.localStorage.getItem('ttod.excludeTracking') === '1') return; }
  catch { /* Normal customer measurement still works without local storage. */ }
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', 'AW-18487849737');
  window.gtag('config', 'G-98RWTMRG0V');
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=AW-18487849737';
  document.head.appendChild(script);
}

const EVENTS = new Set(['quote_start', 'quote_request', 'quote_view', 'quote_error', 'booking_start', 'booking_attempt', 'booking_error', 'generate_lead', 'phone_click', 'social_click', 'content_scroll']);
const PARTNERS = new Set(['Direct', 'Jo Towing', 'Xpress Towing', 'J-Jasmine Towing', 'Jasmine Towing']);

// Never accept form values, arbitrary URLs, error messages or customer identifiers.
export function analyticsParameters(input = {}) {
  const result = { send_to: ANALYTICS_ID };
  if (['en', 'es'].includes(input.language)) result.site_language = input.language;
  if (['ASAP', 'Schedule for later'].includes(input.timing)) result.pickup_timing = input.timing === 'ASAP' ? 'asap' : 'scheduled';
  if (['Sedan', 'SUV', 'Pickup'].includes(input.vehicle)) result.vehicle_type = input.vehicle;
  if (PARTNERS.has(input.leadSource)) result.referral_partner = input.leadSource;
  if (['Facebook', 'Instagram'].includes(input.social)) result.social_network = input.social;
  if ([50, 90].includes(input.depth)) result.percent_scrolled = input.depth;
  return result;
}

export function trackEvent(name, input = {}) {
  if (!EVENTS.has(name) || isTrackingExcluded()) return false;
  try {
    // Queue safely even if the Google script has not loaded yet. Tracking must
    // never prevent a successful booking from reaching its confirmation screen.
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag === 'function') window.gtag('event', name, analyticsParameters(input));
    else (function () { window.dataLayer.push(arguments); })('event', name, analyticsParameters(input));
    return true;
  } catch { return false; }
}
