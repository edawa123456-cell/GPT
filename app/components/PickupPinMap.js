'use client';

import { useEffect, useRef, useState } from 'react';

export default function PickupPinMap({ initialPin, onMove, isSpanish }) {
  const container = useRef(null);
  const initial = useRef(initialPin);
  const onMoveRef = useRef(onMove);
  const [error, setError] = useState(false);
  onMoveRef.current = onMove;

  useEffect(() => {
    let active = true;
    let map;
    let listener;
    async function start() {
      try {
        const { Map } = await window.google.maps.importLibrary('maps');
        if (!active) return;
        map = new Map(container.current, {
          center: initial.current,
          zoom: 18,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: 'cooperative',
          clickableIcons: false,
        });
        listener = map.addListener('idle', () => {
          const center = map.getCenter();
          if (center) onMoveRef.current({ lat: center.lat(), lng: center.lng() });
        });
      } catch {
        if (active) setError(true);
      }
    }
    start();
    return () => {
      active = false;
      listener?.remove();
      if (map) window.google.maps.event.clearInstanceListeners(map);
    };
  }, []);

  return (
    <div>
      <p className="finePrint">{isSpanish ? 'Mueve el mapa hasta colocar el pin donde debe llegar la grúa. Verifica el lado correcto de la carretera.' : 'Move the map to place the pin where the truck should arrive. Check the correct side of the road.'}</p>
      {error && <p role="alert">{isSpanish ? 'No se pudo cargar el mapa. Puedes confirmar las coordenadas del GPS o escribir una dirección.' : 'The map could not load. You can confirm the GPS coordinates or type an address.'}</p>}
      <div style={{ position: 'relative', height: 260, borderRadius: 12, overflow: 'hidden' }}>
        <div ref={container} role="region" aria-label={isSpanish ? 'Mapa del lugar de recogida' : 'Pickup location map'} style={{ height: '100%' }} />
        <svg aria-hidden="true" viewBox="0 0 32 42" width="32" height="42" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -100%)', pointerEvents: 'none' }}>
          <path d="M16 41C13 35 2 25 2 16a14 14 0 1 1 28 0c0 9-11 19-14 25Z" fill="#dc2626" stroke="white" strokeWidth="2" />
          <circle cx="16" cy="16" r="5" fill="white" />
        </svg>
      </div>
    </div>
  );
}
