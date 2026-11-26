'use client';

import { useEffect, useRef, useState } from 'react';

let placesPromise;
function ensureGooglePlaces() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Browser unavailable'));
  if (window.google?.maps?.importLibrary) return window.google.maps.importLibrary('places');
  if (placesPromise) return placesPromise;
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return Promise.reject(new Error('Google address suggestions are not configured'));
  placesPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('google-maps-script');
    const onReady = () => window.google?.maps?.importLibrary
      ? window.google.maps.importLibrary('places').then(resolve, reject)
      : reject(new Error('Google Places could not initialize'));
    if (existing) {
      const pollStart = Date.now();
      const poll = () => {
        if (window.google?.maps?.importLibrary) return onReady();
        if (Date.now() - pollStart > 12000) return reject(new Error('Google Places timed out'));
        setTimeout(poll, 100);
      };
      poll();
      return;
    }
    const callback = '__ttodRoadsidePlacesReady';
    window[callback] = () => {
      delete window[callback];
      onReady();
    };
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.async = true;
    script.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(key) +
      '&v=weekly&loading=async&libraries=places&callback=' + callback;
    script.onerror = () => {
      placesPromise = null;
      delete window[callback];
      reject(new Error('Google Places could not load'));
    };
    document.head.appendChild(script);
  }).catch(error => { placesPromise = null; throw error; });
  return placesPromise;
}

export default function RoadsideAddressInput({ value, onChange, locale = 'en', placeholder, id }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const session = useRef(null);
  const requestId = useRef(0);
  const ignoreNextChange = useRef(false);

  useEffect(() => {
    let active = true;
    ensureGooglePlaces().then(() => { if (active) setReady(true); })
      .catch(() => { if (active) setError(locale === 'es'
        ? 'Las sugerencias no están disponibles. Escribe la dirección completa.'
        : 'Address suggestions unavailable. Enter the full address.'); });
    return () => { active = false; };
  }, [locale]);

  useEffect(() => {
    if (ignoreNextChange.current) {
      ignoreNextChange.current = false;
      return;
    }
    if (!ready || value.trim().length < 3) {
      requestId.current++;
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const request = ++requestId.current;
    const timer = setTimeout(async () => {
      try {
        const places = await window.google.maps.importLibrary('places');
        const { AutocompleteSuggestion, AutocompleteSessionToken } = places;
        if (!AutocompleteSuggestion) throw new Error('Suggestions unavailable');
        if (!session.current && AutocompleteSessionToken) session.current = new AutocompleteSessionToken();
        const result = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: value.trim(),
          includedRegionCodes: ['us'],
          region: 'us',
          language: locale === 'es' ? 'es' : 'en',
          locationBias: { center: { lat: 32.76, lng: -97.33 }, radius: 50000 },
          ...(session.current ? { sessionToken: session.current } : {}),
        });
        if (request !== requestId.current) return;
        const matches = (result.suggestions || [])
          .map(item => item.placePrediction)
          .filter(Boolean)
          .slice(0, 6)
          .map(p => p.text?.toString?.() || '')
          .filter(Boolean);
        setSuggestions(matches);
        setOpen(matches.length > 0);
        setError('');
      } catch {
        if (request !== requestId.current) return;
        setSuggestions([]);
        setOpen(false);
        setError(locale === 'es'
          ? 'No pudimos obtener sugerencias. Escribe la dirección completa.'
          : 'Could not fetch suggestions. Enter the full address.');
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [value, ready, locale]);

  function selectAddress(address) {
    requestId.current++;
    ignoreNextChange.current = true;
    setSuggestions([]);
    setOpen(false);
    session.current = null;
    onChange(address);
  }

  return (
    <div className="addressField roadsideAddressField">
      <input
        id={id}
        value={value}
        onChange={event => { onChange(event.target.value); setOpen(true); }}
        onFocus={() => { if (suggestions.length) setOpen(true); }}
        onBlur={() => { setTimeout(() => setOpen(false), 180); }}
        placeholder={placeholder}
        maxLength={300}
        required
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open && suggestions.length > 0}
        aria-controls={id + '-suggestions'}
      />
      {open && suggestions.length > 0 && (
        <div id={id + '-suggestions'} className="addressSuggestions" role="listbox">
          {suggestions.map((address, index) => (
            <button type="button" key={address + index} role="option" aria-selected="false"
              className="addressSuggestion" onMouseDown={event => event.preventDefault()}
              onClick={() => selectAddress(address)}>
              {address}
            </button>
          ))}
          <div className="googleAttribution">Powered by Google</div>
        </div>
      )}
      {error && <p className="roadsideAddressHint">{error}</p>}
    </div>
  );
}
