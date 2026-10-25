export const ANALYTICS_ID = 'G-98RWTMRG0V';

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
  if (!EVENTS.has(name) || typeof window === 'undefined') return false;
  try {
    // Queue safely even if the Google script has not loaded yet. Tracking must
    // never prevent a successful booking from reaching its confirmation screen.
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag === 'function') window.gtag('event', name, analyticsParameters(input));
    else (function () { window.dataLayer.push(arguments); })('event', name, analyticsParameters(input));
    return true;
  } catch { return false; }
}
