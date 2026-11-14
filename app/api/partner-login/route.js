import { NextResponse } from 'next/server';
import { configured, createSession, safeEqual, PARTNER_COOKIE, partnerMaxAge } from '../../lib/partnerAccess';

export const runtime = 'nodejs';

export async function POST(request) {
  const origin = new URL(request.url).origin;
  const sentOrigin = request.headers.get('origin');
  if (sentOrigin && sentOrigin !== origin) return new Response('Forbidden', { status: 403 });
  const type = request.headers.get('content-type') || '';
  if (!type.startsWith('application/x-www-form-urlencoded') && !type.startsWith('multipart/form-data')) return new Response('Unsupported Media Type', { status: 415 });
  const form = await request.formData();
  const submitted = form.get('accessCode');
  if (!configured()) return NextResponse.redirect(new URL('/locate/start?error=setup', request.url), { status: 303 });
  if (typeof submitted !== 'string' || submitted.length > 256 || !safeEqual(submitted, process.env.TTOD_PARTNER_ACCESS_CODE)) {
    return NextResponse.redirect(new URL('/locate/start?error=invalid', request.url), { status: 303 });
  }
  const response = NextResponse.redirect(new URL('/locate/start', request.url), { status: 303 });
  response.cookies.set(PARTNER_COOKIE, createSession(), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/locate/start', maxAge: partnerMaxAge });
  return response;
}
