import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { origin, destination, originCoordinates } = await request.json();
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Google Maps API key is not configured.' }, { status: 500 });
    }

    const hasPin = originCoordinates != null;
    const validPin = hasPin && typeof originCoordinates.lat === 'number' && typeof originCoordinates.lng === 'number' && Number.isFinite(originCoordinates.lat) && Number.isFinite(originCoordinates.lng) && Math.abs(originCoordinates.lat) <= 90 && Math.abs(originCoordinates.lng) <= 180;
    if (hasPin && !validPin) return NextResponse.json({ error: 'Invalid pickup coordinates.' }, { status: 400 });

    if ((!origin && !validPin) || !destination) {
      return NextResponse.json({ error: 'Pickup and drop-off are required.' }, { status: 400 });
    }


    try {
      const geocodeQuery = validPin
        ? `latlng=${originCoordinates.lat},${originCoordinates.lng}`
        : `address=${encodeURIComponent(origin)}`;
      const geoResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?${geocodeQuery}&key=${apiKey}`
      );

      const geoData = await geoResponse.json();

      if (!geoResponse.ok || geoData.status !== 'OK' || !geoData.results?.length) {
        return NextResponse.json(
          { error: 'We could not verify your pickup address. Please try again or call us.' },
          { status: 502 }
        );
      }

      const pickupInTexas = geoData.results[0].address_components?.some(
        (component) =>
          component.types.includes('administrative_area_level_1') &&
          component.short_name === 'TX'
      );

      if (!pickupInTexas) {
        return NextResponse.json(
          { error: 'Sorry, we currently accept towing requests with pickup locations in Texas only.' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Pickup location verification failed:', error.message);
      return NextResponse.json(
        { error: 'Unable to verify your pickup location right now. Please try again or call us.' },
        { status: 502 }
      );
    }
    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration'
      },
      body: JSON.stringify({
        origin: validPin
          ? { location: { latLng: { latitude: originCoordinates.lat, longitude: originCoordinates.lng } } }
          : { address: origin },
        destination: { address: destination },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE'
      })
    });

    const data = await response.json();

    if (!response.ok || !data.routes?.length) {
      return NextResponse.json(
        { error: data?.error?.message || 'Could not calculate the driving route.' },
        { status: 400 }
      );
    }

    const distanceMeters = data.routes[0].distanceMeters;
    const exactMiles = distanceMeters / 1609.344;
    const billedMiles = Math.ceil(exactMiles);

    return NextResponse.json({
      exactMiles: Number(exactMiles.toFixed(1)),
      billedMiles,
      duration: data.routes[0].duration || null
    });
  } catch (error) {
    return NextResponse.json({ error: 'Unable to calculate route distance.' }, { status: 500 });
  }
}
