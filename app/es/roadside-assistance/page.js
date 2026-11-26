import RoadsideRequest from '../../components/RoadsideRequest';
import { SITE_URL } from '../../lib/siteContent';

export const metadata = {
  title: 'Asistencia en carretera DFW | Batería, Llantas y Apertura | Tow Truck On Demand',
  description: 'Asistencia en carretera desde $50 en Fort Worth, Arlington y zonas cercanas de DFW. Entrega de gasolina $75 con 1 galón incluido. Paso de corriente, cambio de llanta de repuesto, apertura de vehículos y entrega de combustible.',
  alternates: { canonical: SITE_URL + '/es/roadside-assistance', languages: { en: SITE_URL + '/roadside-assistance', es: SITE_URL + '/es/roadside-assistance' } },
};

export default function RoadsideAssistanceSpanishPage() {
  return <RoadsideRequest locale="es" />;
}
