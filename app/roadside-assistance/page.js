import RoadsideRequest from '../components/RoadsideRequest';
import { SITE_URL } from '../lib/siteContent';

export const metadata = {
  title: 'Roadside Assistance DFW | Jump Starts, Tires, Lockouts | Tow Truck On Demand',
  description: 'Request roadside assistance in Fort Worth, Arlington and surrounding DFW areas. Jump-starts, spare tire changes, vehicle lockouts and fuel delivery. Price and availability confirmed before dispatch.',
  alternates: { canonical: SITE_URL + '/roadside-assistance', languages: { en: SITE_URL + '/roadside-assistance', es: SITE_URL + '/es/roadside-assistance' } },
};

export default function RoadsideAssistancePage() {
  return <RoadsideRequest locale="en" />;
}
