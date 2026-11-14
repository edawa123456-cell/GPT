import { NextResponse } from 'next/server';
import { PARTNER_COOKIE } from '../../lib/partnerAccess';

export async function POST(request) {
  const origin = new URL(request.url).origin;
  const sentOrigin = request.headers.get('origin');
  if (sentOrigin && sentOrigin !== origin) return new Response('Forbidden', { status: 403 });
  const response = NextResponse.redirect(new URL('/locate/start', request.url), { status: 303 });
  response.cookies.set(PARTNER_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/locate/start', maxAge: 0 });
  return response;
}
