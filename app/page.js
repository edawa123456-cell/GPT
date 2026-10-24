import TowBooking from "./components/TowBooking";
import { SITE_URL } from './lib/siteContent';

export const metadata = {
  title: 'DFW Towing Quotes & Pickup Requests | TowTruckOnDemand',
  description: 'Get an online towing quote for a sedan, SUV or pickup in DFW and surrounding areas. Request ASAP or scheduled pickup. Pay at pickup.',
  alternates: { canonical: SITE_URL + '/', languages: { en: SITE_URL + '/', es: SITE_URL + '/es', 'x-default': SITE_URL + '/' } },
  openGraph: { title: 'Need a tow? Start with your price.', description: 'Online towing quotes and pickup requests for DFW and surrounding areas.', url: SITE_URL + '/', locale: 'en_US', images: [{ url: '/tow-truck-fleet.png', alt: 'TowTruckOnDemand fleet' }] },
};

export default function Home() { return <TowBooking locale="en" />; }
