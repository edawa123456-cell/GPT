import './globals.css';
import Script from 'next/script';
import { initializeGoogleTracking } from './lib/analytics';
import AnalyticsEvents from './components/AnalyticsEvents';
import { SITE_URL, PHONE_HREF, SOCIAL_LINKS } from './lib/siteContent';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Tow Truck On Demand',
  openGraph: { siteName: 'TowTruckOnDemand', type: 'website', images: [{ url: '/tow-truck-fleet.png', alt: 'TowTruckOnDemand fleet' }] },
  twitter: { card: 'summary_large_image' },
  description: 'Get an upfront towing quote and request a tow online.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}<AnalyticsEvents />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org', '@type': 'Organization',
          name: 'TowTruckOnDemand', url: SITE_URL,
          telephone: PHONE_HREF.replace('tel:', ''),
          logo: SITE_URL + '/towtruckondemand-logo.png',
          ...(SOCIAL_LINKS.length ? { sameAs: SOCIAL_LINKS.map(link => link.url) } : {}),
        }).replace(/</g, '\\u003c') }} />
      </body>

      <Script id="google-ads-tag" strategy="afterInteractive">
        {`(${initializeGoogleTracking.toString()})();`}
      </Script>
    </html>
  );
}
