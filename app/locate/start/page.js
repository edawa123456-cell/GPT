import { cookies } from 'next/headers';
import PartnerLocationLinks from './PartnerLocationLinks';
import { configured, PARTNER_COOKIE, validSession } from '../../lib/partnerAccess';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Partner Location Link | TowTruckOnDemand',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default async function LocationPartnerPage({ searchParams }) {
  const store = await cookies();
  const authorized = validSession(store.get(PARTNER_COOKIE)?.value);
  if (authorized) return (
    <>
      <PartnerLocationLinks />
      <form action="/api/partner-logout" method="post" style={{ textAlign: 'center', marginBottom: 40 }}>
        <button type="submit" style={{ background: 'transparent', border: 0, color: '#536072', textDecoration: 'underline', cursor: 'pointer' }}>Sign out of partner tool</button>
      </form>
    </>
  );

  const params = await searchParams;
  const setupMissing = !configured();
  const invalid = params?.error === 'invalid';

  return (
    <main style={{ padding: '35px 16px' }}>
      <section style={{ maxWidth: 430, background: '#fff', margin: '0 auto', padding: 26, border: '1px solid #e5eaf0', borderRadius: 18 }}>
        <strong style={{ color: '#075fe6' }}>TowTruckOnDemand · Partner access</strong>
        <h1 style={{ fontSize: 28, lineHeight: 1.2 }}>Enter partner access code</h1>
        {setupMissing ? (
          <p role="alert" style={{ color: '#9b2c2c' }}>Partner access is not configured. The site owner must add TTOD_PARTNER_ACCESS_CODE and TTOD_PARTNER_SESSION_SECRET to Vercel environment settings.</p>
        ) : (
          <form method="post" action="/api/partner-login">
            <label htmlFor="partnerAccessCode">Access code</label>
            <input id="partnerAccessCode" type="password" name="accessCode" required autoComplete="off" maxLength="256" />
            {invalid && <p role="alert" style={{ color: '#9b2c2c' }}>Incorrect code. Please try again.</p>}
            <button type="submit" style={{ width: '100%', marginTop: 18, padding: 14, border: 0, borderRadius: 10, color: '#fff', background: '#075fe6', cursor: 'pointer', fontWeight: 800 }}>Continue</button>
          </form>
        )}
        <p style={{ color: '#657084', fontSize: 13, lineHeight: 1.5 }}>Only authorized dispatchers should create customer location links. Customers will not need an access code.</p>
      </section>
    </main>
  );
}
