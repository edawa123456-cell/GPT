'use client';

import { useEffect } from 'react';
import { trackEvent } from '../lib/analytics';

export default function AnalyticsEvents() {
  useEffect(() => {
    const language = document.querySelector('main')?.lang === 'es' ? 'es' : 'en';
    let quoteStarted = false;
    const depths = new Set();
    function focus(event) {
      if (!quoteStarted && event.target instanceof Element && event.target.closest('#booking form')) {
        quoteStarted = true;
        trackEvent('quote_start', { language });
      }
    }
    function click(event) {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (href?.startsWith('tel:')) trackEvent('phone_click', { language });
      const social = href === 'https://www.facebook.com/TowTruckOnDemand' ? 'Facebook'
        : href === 'https://www.instagram.com/towtruckondemand/' ? 'Instagram' : null;
      if (social) trackEvent('social_click', { language, social });
    }
    function scroll() {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      if (height <= 0) return;
      const percent = window.scrollY / height * 100;
      for (const depth of [50, 90]) {
        if (percent >= depth && !depths.has(depth)) {
          depths.add(depth);
          trackEvent('content_scroll', { language, depth });
        }
      }
    }
    document.addEventListener('focusin', focus);
    document.addEventListener('click', click);
    window.addEventListener('scroll', scroll, { passive: true });
    return () => {
      document.removeEventListener('focusin', focus);
      document.removeEventListener('click', click);
      window.removeEventListener('scroll', scroll);
    };
  }, []);
  return null;
}
