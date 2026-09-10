import './globals.css';

export const metadata = {
  title: 'Tow Truck On Demand',
  description: 'Get an upfront towing quote and request a tow online.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
