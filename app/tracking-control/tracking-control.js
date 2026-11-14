'use client';

import { useEffect, useState } from 'react';
import { TEST_EXCLUSION_KEY } from '../lib/analytics';

export default function TrackingControl() {
  const [excluded, setExcluded] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    try { setExcluded(localStorage.getItem(TEST_EXCLUSION_KEY) === '1'); }
    catch { setError('This browser blocks storage. Testing preferences cannot be saved.'); }
  }, []);

  function changePreference(value) {
    try {
      if (value) localStorage.setItem(TEST_EXCLUSION_KEY, '1');
      else localStorage.removeItem(TEST_EXCLUSION_KEY);
      // Reload to discard any tag already loaded before visiting this page.
      window.location.reload();
    } catch { setError('Could not save this preference. Tracking has not been changed.'); }
  }

  return <main style={{ maxWidth: 650, margin: '60px auto', padding: 24, lineHeight: 1.6 }}>
    <h1>Exclude my testing</h1>
    <p>Stop this browser’s visits and booking tests from being counted in Google Analytics and Google Ads.</p>
    <p role="status"><strong>{excluded === null ? 'Checking preference…' : excluded ? 'Testing excluded on this browser.' : 'Normal tracking is enabled on this browser.'}</strong></p>
    {error && <p role="alert">{error}</p>}
    <button type="button" disabled={excluded === null || !!error} onClick={() => changePreference(!excluded)}
      style={{ padding: '12px 20px', cursor: 'pointer' }}>
      {excluded ? 'Restore normal tracking' : 'Exclude my testing'}
    </button>
    <p>This applies only to this browser on this website address. Set it separately on each device. Clearing browser storage or using a private window removes the exclusion. Reload any other open website tabs after changing it.</p>
    <p><strong>Bookings still send real requests.</strong> This setting only excludes measurement; it does not prevent emails or dispatch requests. Past tests are not removed.</p>
    <p><a href="/">Open English website</a> · <a href="/es">Abrir sitio en español</a></p>
  </main>;
}
