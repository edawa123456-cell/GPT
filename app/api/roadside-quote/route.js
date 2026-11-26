import { NextResponse } from 'next/server';
import { roadsideMiles } from '../../lib/roadsideDistance';
import { roadsidePrice, roadsideQuote } from '../../lib/roadsidePrice';

export async function POST(request) {
  const data = await request.json().catch(() => null);
  if (roadsidePrice(data?.service, data?.vehicleType) === null ||
      typeof data?.location !== 'string' || data.location.trim().length < 5 || data.location.length > 300)
    return NextResponse.json({ error: 'Invalid quote request' }, { status: 400 });
  const c = data.coordinates;
  if (c != null && (!Number.isFinite(c.lat) || !Number.isFinite(c.lng) || Math.abs(c.lat) > 90 || Math.abs(c.lng) > 180))
    return NextResponse.json({ error: 'Invalid GPS' }, { status: 400 });
  const quote = roadsideQuote(data.service, data.vehicleType, await roadsideMiles(data.location.trim(), c));
  return quote ? NextResponse.json(quote) : NextResponse.json({ error: 'Route unavailable' }, { status: 503 });
}
