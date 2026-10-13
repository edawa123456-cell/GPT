import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { origin, destination } = await request.json();
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Google Maps API key is not configured.' }, { status: 500 });
    }

    if (!origin || !destination) {
      return NextResponse.json({ error: 'Pickup and drop-off are required.' }, { status: 400 });
    }


try {
  const geoResponse = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(origin)}&key=${apiKey}`
  );

  const geoData = await geoResponse.json();

  const states = (geoData.results || []).map((result) =>
    result.address_components?.find((component) =>
      component.types.includes('administrative_area_level_1')
    )?.short_name || 'UNKNOWN'
  );

  console.log('Pickup geocoding diagnostic:', {
    httpStatus: geoResponse.status,
    googleStatus: geoData.status,
    googleError: geoData.error_message || null,
    states
  });
} catch (error) {
  console.error('Pickup geocoding diagnostic failed:', error.message);
}

    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration'
      },
      body: JSON.stringify({
        origin: { address: origin },
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
