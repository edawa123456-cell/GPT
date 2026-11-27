// Roadside dispatch mileage is one way. Towing uses its own pickup and drop-off.
export async function roadsideMiles(address, coords, key = process.env.GOOGLE_MAPS_API_KEY, send = fetch) {
  if (!key) return null;
  try {
    const response = await send('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(5000),
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'routes.distanceMeters' },
      body: JSON.stringify({
        origin: { address: '12612 Clermont Cir, Burleson, TX 76028, USA' },
        destination: coords ? { location: { latLng: { latitude: coords.lat, longitude: coords.lng } } } : { address },
        travelMode: 'DRIVE'
      })
    });
    if (!response.ok) return null;
    const meters = (await response.json()).routes?.[0]?.distanceMeters;
    return Number.isFinite(meters) && meters >= 0 ? meters / 1609.344 : null;
  } catch { return null; }
}
