import RoadsideRequest from '../components/RoadsideRequest';
import { SITE_URL } from '../lib/siteContent';

export const metadata = {
  title: 'Roadside Assistance DFW | Jump Starts, Tires, Lockouts | Tow Truck On Demand',
  description: 'Request roadside assistance in Fort Worth, Arlington and surrounding DFW areas. Jump-starts, spare tire changes, vehicle lockouts and fuel delivery. Jump-starts from $65; spare tire changes $95 for sedans or $165 for SUVs and pickups; lockouts $50; fuel delivery $75 including 1 gallon of gas. Availability confirmed before dispatch.',
  alternates: { canonical: SITE_URL + '/roadside-assistance', languages: { en: SITE_URL + '/roadside-assistance', es: SITE_URL + '/es/roadside-assistance' } },
};

export default function RoadsideAssistancePage() {
  return <RoadsideRequest locale="en" />;
}
