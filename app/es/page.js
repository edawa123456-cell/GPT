import TowBooking from "../components/TowBooking";

export const metadata = {
  title: "Servicio de grúa en DFW | TowTruckOnDemand",
  description: "Cotiza tu servicio de grúa en DFW y áreas cercanas. Consulta tu precio y solicita una grúa en línea.",
  openGraph: { title: "¿Necesitas una grúa? Consulta tu precio.", description: "Cotiza y solicita una grúa en DFW y alrededores.", url: "https://www.towtruckondemand.com/es", locale: "es_US", images: [{ url: "/tow-truck-fleet.png", alt: "Flota de TowTruckOnDemand" }] },
  alternates: { canonical: "https://www.towtruckondemand.com/es", languages: { en: "https://www.towtruckondemand.com/", es: "https://www.towtruckondemand.com/es" } },
};

export default function SpanishHome() {
  return <TowBooking locale="es" />;
}
