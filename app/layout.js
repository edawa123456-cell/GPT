import './globals.css';
import Script from 'next/script';

export const metadata = {
  title: 'Tow Truck On Demand',
  description: 'Get an upfront towing quote and request a tow online.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>

      <Script
        src="https://www.googletagmanager.com/gtag/js?id=AW-18487849737"
        strategy="afterInteractive"
      />

      <Script id="google-ads-tag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'AW-18487849737');
        `}
      </Script>
    </html>
  );
}
