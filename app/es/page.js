import TowBooking from "../components/TowBooking";

export const metadata = {
  title: "Servicio de grúa en DFW | TowTruckOnDemand",
  description: "Cotiza tu servicio de grúa en DFW y áreas cercanas. Consulta tu precio y solicita una grúa en línea.",
  alternates: { canonical: "https://towtruckondemand.com/es", languages: { en: "https://towtruckondemand.com/", es: "https://towtruckondemand.com/es" } },
};

export default function SpanishHome() {
  return <TowBooking locale="es" />;
}
