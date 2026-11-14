import TowBooking from "./components/TowBooking";
import { SITE_URL } from './lib/siteContent';

export const metadata = {
  title: 'Fort Worth & DFW Towing | Instant Price | TowTruckOnDemand',
  description: 'Get an instant flatbed towing price for Fort Worth, Arlington and surrounding DFW areas. Request a tow for your sedan, SUV or pickup online. Pay at pickup.',
  alternates: { canonical: SITE_URL + '/', languages: { en: SITE_URL + '/', es: SITE_URL + '/es', 'x-default': SITE_URL + '/' } },
  openGraph: { title: 'Fort Worth & DFW towing. See your price online.', description: 'Flatbed towing for Fort Worth, Arlington and surrounding DFW areas. Get your price, request a tow and pay at pickup.', url: SITE_URL + '/', locale: 'en_US', images: [{ url: '/tow-truck-fleet.png', alt: 'TowTruckOnDemand fleet' }] },
};

export default function Home() { return <TowBooking locale="en" />; }
