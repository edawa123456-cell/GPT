import { HOOKUP_FEE, PER_MILE, MINIMUM_CHARGE, AFTER_HOURS_SURCHARGE, NON_ROLLING_SURCHARGE } from './bookingPrice';

export const SITE_URL = 'https://www.towtruckondemand.com';
export const PHONE = '(210) 806-2061';
export const PHONE_HREF = 'tel:+12108062061';
// Add only owner-confirmed TowTruckOnDemand profile URLs. Empty means no dead social links.
export const SOCIAL_LINKS = [{ name: 'Facebook', url: 'https://www.facebook.com/TowTruckOnDemand' }];
export const PAGE_SLUGS = ['services', 'pricing', 'faq', 'towing-guide', 'about', 'contact'];
export const sitePath = (slug = '', locale = 'en') => `${locale === 'es' ? '/es' : ''}/${slug}`.replace(/\/$/, '') || '/';

export const pages = {
  services: {
    en: { nav: 'Services', title: 'Towing services in DFW', description: 'Request towing for a sedan, SUV or pickup. See how local trips, scheduled pickups and non-rolling vehicles work with TowTruckOnDemand.', kicker: 'THE RIGHT DETAILS. A CLEARER REQUEST.', heading: 'A tow that starts with your situation.', intro: 'A breakdown, a trip to the shop or a pickup planned for another day—start with where the vehicle is and where it needs to go.', sections: [
      { title: 'Cars, SUVs and pickups', text: 'Choose Sedan, SUV or Pickup in the quote form and enter the vehicle make and model. Tell us if the vehicle cannot roll so the request reflects its condition.' },
      { title: 'Local trips and shop drop-offs', text: 'Enter the pickup and destination to calculate the driving route. Have the shop name, drop-off instructions and any access details ready when we contact you.' },
      { title: 'ASAP or a scheduled pickup', text: 'Choose ASAP for the earliest available service, or select a future pickup date and time. All scheduled times are Central Time. We confirm availability before dispatch.' },
      { title: 'When the situation needs a conversation', text: 'Call about restricted access, low-clearance parking, locked steering, missing wheels or a vehicle that cannot roll. These details help us confirm whether the requested service is suitable. The online form currently covers sedans, SUVs and pickups; call about anything outside those choices.' },
    ], related: ['pricing', 'towing-guide'] },
    es: { nav: 'Servicios', title: 'Servicio de grúa en DFW', description: 'Solicita una grúa para sedán, SUV o camioneta pickup. Conoce cómo funcionan los traslados locales y las recogidas programadas.', kicker: 'LOS DATOS CORRECTOS. UNA SOLICITUD MÁS CLARA.', heading: 'Cada traslado empieza con tu situación.', intro: 'Una avería, un traslado al taller o una recogida para otro día: comienza con la ubicación del vehículo y su destino.', sections: [
      { title: 'Sedanes, SUV y camionetas pickup', text: 'Selecciona el tipo de vehículo en el formulario e indica la marca y el modelo. Si no puede rodar, márcalo para que la solicitud refleje su condición.' },
      { title: 'Traslados locales y al taller', text: 'Ingresa la recogida y el destino para calcular la ruta. Ten a mano el nombre del taller, las instrucciones de entrega y los detalles de acceso cuando te contactemos.' },
      { title: 'Lo antes posible o para otro día', text: 'Selecciona lo antes posible para solicitar la primera disponibilidad, o elige una fecha y hora futuras. Todos los horarios son de la zona central. Confirmamos disponibilidad antes de enviar la grúa.' },
      { title: 'Situaciones que conviene consultar', text: 'Llámanos si hay acceso restringido, poca altura libre, dirección bloqueada, ruedas faltantes o si el vehículo no puede rodar. Así podemos confirmar si el servicio es adecuado. El formulario cubre sedanes, SUV y pickups; consulta por otros vehículos.' },
    ], related: ['pricing', 'towing-guide'] },
  },
  pricing: {
    en: { nav: 'Pricing', title: 'How towing prices work', description: 'Understand the hookup fee, mileage, minimum charge and vehicle or after-hours additions before requesting your tow.', kicker: 'KNOW WHAT GOES INTO YOUR QUOTE.', heading: 'Your route. Your vehicle. Your price.', intro: 'The online quote brings the trip details together before you request service. Here is how the current rates are calculated.', rates: true, sections: [
      { title: 'Driving miles, rounded up', text: `Mileage is based on the calculated driving route, not straight-line distance. Mileage starts at mile one and is rounded up to a whole mile. A 4.2-mile route is billed as 5 miles.` },
      { title: 'The pickup time sets the hours charge', text: `Business hours are Monday–Saturday, 8:00 AM–6:00 PM Central Time. Outside those hours and all day Sunday, $${AFTER_HOURS_SURCHARGE} is added. Scheduled requests use the selected pickup time. If an ASAP price changes as service hours change, you review the updated amount before sending.` },
      { title: 'A simple example', text: `A sedan that rolls, traveling 10 billed miles during business hours: $${HOOKUP_FEE} hookup + 10 × $${PER_MILE} = $${HOOKUP_FEE + 10 * PER_MILE}. The same trip outside business hours is $${HOOKUP_FEE + 10 * PER_MILE + AFTER_HOURS_SURCHARGE}.` },
      { title: 'Pay at pickup', text: 'No online payment is needed to send a request. Pay at pickup with cash, card, Zelle or Cash App. Tell us the correct vehicle condition and route; if the trip or circumstances change, confirm any revised amount with us before service.' },
    ], related: ['faq', 'services'] },
    es: { nav: 'Precios', title: 'Cómo se calcula el precio de la grúa', description: 'Conoce la tarifa de enganche, las millas, el cargo mínimo y los suplementos antes de solicitar una grúa.', kicker: 'CONOCE LOS DETALLES DE TU COTIZACIÓN.', heading: 'Tu ruta. Tu vehículo. Tu precio.', intro: 'La cotización combina los datos del traslado antes de enviar la solicitud. Así se calculan las tarifas actuales.', rates: true, sections: [
      { title: 'Millas de recorrido, redondeadas hacia arriba', text: 'Usamos la ruta de conducción calculada, no la distancia en línea recta. Se cobra desde la primera milla y se redondea a la siguiente milla entera: un recorrido de 4.2 millas se cobra como 5.' },
      { title: 'La hora de recogida determina el suplemento', text: `El horario habitual es de lunes a sábado, de 8:00 a. m. a 6:00 p. m., hora del centro. Fuera de horario y todos los domingos se agregan $${AFTER_HOURS_SURCHARGE}. Para solicitudes programadas se usa la hora elegida. Si cambia el precio de una solicitud inmediata por el horario, revisas el nuevo importe antes de enviarla.` },
      { title: 'Un ejemplo sencillo', text: `Un sedán que puede rodar y recorre 10 millas facturadas dentro del horario habitual: $${HOOKUP_FEE} de enganche + 10 × $${PER_MILE} = $${HOOKUP_FEE + 10 * PER_MILE}. El mismo recorrido fuera de horario cuesta $${HOOKUP_FEE + 10 * PER_MILE + AFTER_HOURS_SURCHARGE}.` },
      { title: 'Pago al recoger el vehículo', text: 'No necesitas pagar en línea para enviar la solicitud. Aceptamos efectivo, tarjeta, Zelle y Cash App al recoger el vehículo. Proporciona la ruta y condición correctas; si cambian las circunstancias, confirma cualquier nuevo importe antes del servicio.' },
    ], related: ['faq', 'services'] },
  },
  faq: {
    en: { nav: 'FAQs', title: 'Towing questions, answered', description: 'Answers about scheduled towing, payment at pickup, GPS pins, pricing and what happens after a tow request.', kicker: 'A FEW THINGS YOU MIGHT BE WONDERING.', heading: 'Clear answers before you book.', intro: 'Start here for the common questions. If your vehicle or pickup location needs a closer look, give us a call.', questions: [
      ['Does submitting a request send a truck immediately?', 'No. We contact you to confirm availability and pickup time before dispatch. ASAP means you are requesting the earliest available service; it is not a guaranteed arrival time.'],
      ['Can I schedule a tow for tomorrow?', 'Yes. Choose Schedule for later, then select a future pickup date and time. Times are shown in Central Time. We confirm availability with you before dispatch.'],
      ['What if I do not know the pickup address?', 'Use the current-location option on the quote form. Check the map, adjust the pin if needed and confirm the pickup point. Your browser needs location permission. You can also type an address instead.'],
      ['When and how do I pay?', 'Pay at pickup by cash, card, Zelle or Cash App. Sending the online request does not require an online payment.'],
      ['What if the vehicle cannot roll?', 'Select No under Does it roll? The current non-rolling addition is $40. Call to describe missing wheels, locked steering, restricted access or other loading concerns so we can confirm suitable service.'],
      ['How are Sunday and evening pickups priced?', 'The $60 after-hours addition applies outside Monday–Saturday, 8:00 AM–6:00 PM Central Time, and all day Sunday. For a scheduled pickup, the selected pickup time determines this addition.'],
      ['Where do you provide service?', 'The website is focused on DFW and surrounding areas. Call to confirm availability for your specific pickup and destination, especially for trips outside the area.'],
      ['Can I change my pickup time or destination?', 'Call us with your name, phone number and the details of your request. Confirm the new timing and any change in price before service.'],
    ], related: ['pricing', 'towing-guide'] },
    es: { nav: 'Preguntas', title: 'Respuestas sobre el servicio de grúa', description: 'Respuestas sobre recogidas programadas, pagos, ubicación por GPS, precios y el proceso después de solicitar una grúa.', kicker: 'ANTES DE SOLICITAR TU GRÚA.', heading: 'Respuestas claras a tus preguntas.', intro: 'Aquí encontrarás las dudas habituales. Si tu vehículo o ubicación necesita una revisión más detallada, llámanos.', questions: [
      ['¿La solicitud envía una grúa inmediatamente?', 'No. Te contactamos para confirmar disponibilidad y hora de recogida antes del despacho. Lo antes posible solicita la primera disponibilidad; no garantiza una hora de llegada.'],
      ['¿Puedo programar una grúa para mañana?', 'Sí. Selecciona Programar para después y elige una fecha y hora futuras. Todos los horarios son de la zona central. Confirmamos disponibilidad contigo antes de enviar la grúa.'],
      ['¿Y si no conozco la dirección de recogida?', 'Usa la opción de ubicación actual del formulario. Revisa el mapa, ajusta el pin si hace falta y confirma el punto. Tu navegador necesita permiso de ubicación. También puedes escribir una dirección.'],
      ['¿Cuándo y cómo pago?', 'Paga al recoger el vehículo con efectivo, tarjeta, Zelle o Cash App. No se necesita un pago en línea para enviar la solicitud.'],
      ['¿Qué pasa si el vehículo no puede rodar?', 'Selecciona No en la pregunta correspondiente. El suplemento actual es de $40. Llámanos para explicar si faltan ruedas, la dirección está bloqueada o hay dificultades de acceso o carga.'],
      ['¿Cómo se cobran las noches y los domingos?', 'Se agregan $60 fuera del horario de lunes a sábado, de 8:00 a. m. a 6:00 p. m., hora del centro, y todos los domingos. En una recogida programada se usa la hora seleccionada.'],
      ['¿Dónde ofrecen servicio?', 'El sitio está enfocado en DFW y sus alrededores. Confirma por teléfono la disponibilidad para tu recogida y destino, especialmente fuera de la zona.'],
      ['¿Puedo cambiar la hora o el destino?', 'Llámanos con tu nombre, teléfono y datos de la solicitud. Confirma el nuevo horario y cualquier cambio de precio antes del servicio.'],
    ], related: ['pricing', 'towing-guide'] },
  },
  'towing-guide': {
    en: { nav: 'Towing guide', title: 'Before your tow: a simple pickup guide', description: 'Prepare your pickup details, vehicle information and destination for a smoother tow request and handoff.', kicker: 'A LITTLE PREPARATION GOES A LONG WAY.', heading: 'Make the pickup easier.', intro: 'You do not need to know towing terminology. These are the practical details that help us understand your request.', sections: [
      { title: '1. Get the pickup point right', text: 'Use the complete address, or confirm a GPS pin when the address is unclear. A street address alone may not show which parking lot, entrance or level the vehicle is on. Share those access details when we contact you.' },
      { title: '2. Describe the vehicle as it is', text: 'Have the make and model ready. Tell us whether it rolls, whether keys are available and whether the steering or wheels are locked. Mention damage or modifications that could affect loading.' },
      { title: '3. Confirm the destination', text: 'Check the shop or delivery address and its receiving hours. For after-hours drop-offs, arrange any instructions with the destination and share them with us before the trip.' },
      { title: '4. Keep the handoff simple', text: 'Have the keys and any access instructions available. Remove belongings you want to keep with you when it is practical to do so. Keep your phone reachable so we can confirm pickup arrangements.' },
      { title: '5. Review the schedule and payment', text: 'Check the pickup date and Central time shown in your request. We contact you to confirm availability before dispatch. Payment is collected at pickup by cash, card, Zelle or Cash App.' },
    ], related: ['faq', 'contact'] },
    es: { nav: 'Guía de recogida', title: 'Antes de la grúa: guía para la recogida', description: 'Prepara la ubicación, los datos del vehículo y el destino para facilitar la solicitud y la recogida.', kicker: 'UN POCO DE PREPARACIÓN AYUDA MUCHO.', heading: 'Facilita la recogida de tu vehículo.', intro: 'No necesitas conocer términos de grúas. Estos datos prácticos nos ayudan a entender tu solicitud.', sections: [
      { title: '1. Confirma el punto de recogida', text: 'Usa la dirección completa o confirma un pin de GPS si no conoces la dirección. Indica también el estacionamiento, entrada o nivel donde se encuentra el vehículo cuando te contactemos.' },
      { title: '2. Describe la condición del vehículo', text: 'Ten a mano la marca y el modelo. Indica si puede rodar, si tienes las llaves y si la dirección o las ruedas están bloqueadas. Menciona daños o modificaciones que puedan afectar la carga.' },
      { title: '3. Revisa el destino', text: 'Confirma la dirección y el horario de recepción del taller o destino. Si la entrega será fuera de horario, acuerda las instrucciones con el lugar y compártelas antes del traslado.' },
      { title: '4. Prepara la entrega', text: 'Ten disponibles las llaves y las instrucciones de acceso. Retira las pertenencias que quieras llevar contigo cuando sea práctico hacerlo. Mantén tu teléfono disponible para confirmar los detalles.' },
      { title: '5. Revisa el horario y el pago', text: 'Comprueba la fecha y hora del centro que aparecen en tu solicitud. Te contactamos para confirmar disponibilidad antes del despacho. El pago es al recoger el vehículo: efectivo, tarjeta, Zelle o Cash App.' },
    ], related: ['faq', 'contact'] },
  },
  about: {
    en: { nav: 'About us', title: 'About TowTruckOnDemand', description: 'A simpler way to get a towing quote and request pickup in DFW, with clear trip details and payment at pickup.', kicker: 'LESS GUESSWORK. MORE CLARITY.', heading: 'Towing should start with a clear answer.', intro: 'TowTruckOnDemand brings the first steps online: enter your route, see a price and send the details that matter for your pickup.', sections: [
      { title: 'Built around the actual trip', text: 'The quote starts with your pickup and destination, then accounts for vehicle type, rolling condition and requested pickup time. You can review those details before sending your request.' },
      { title: 'Online convenience, a real conversation', text: 'The form gets the essentials to us. We then contact you to confirm availability and pickup arrangements before dispatch. For an unusual situation or a change to a request, call us directly.' },
      { title: 'Straightforward payment', text: 'There is no online checkout charge to send a request. Payment is collected at pickup, and the quote form explains the current mileage and service additions.' },
      { title: 'DFW and surrounding areas', text: 'Our website is focused on towing requests in the Dallas–Fort Worth area and nearby communities. Availability depends on the pickup, destination and vehicle; confirm your trip with us.' },
    ], related: ['services', 'contact'] },
    es: { nav: 'Nosotros', title: 'Acerca de TowTruckOnDemand', description: 'Una forma más sencilla de cotizar y solicitar una grúa en DFW, con datos claros del traslado y pago al recoger el vehículo.', kicker: 'MENOS DUDAS. MÁS CLARIDAD.', heading: 'Una grúa empieza con una respuesta clara.', intro: 'TowTruckOnDemand lleva los primeros pasos a internet: ingresa tu ruta, consulta el precio y envía los datos de tu recogida.', sections: [
      { title: 'Basado en tu traslado', text: 'La cotización usa la recogida y el destino, el tipo y condición del vehículo y la hora solicitada. Puedes revisar los detalles antes de enviar la solicitud.' },
      { title: 'Comodidad en línea, contacto directo', text: 'El formulario nos envía lo esencial. Después te contactamos para confirmar disponibilidad y detalles antes del despacho. Llámanos para situaciones especiales o cambios en una solicitud.' },
      { title: 'Pago sencillo', text: 'No hay un cobro en línea para enviar una solicitud. El pago es al recoger el vehículo; el formulario explica las millas y los suplementos vigentes.' },
      { title: 'DFW y sus alrededores', text: 'El sitio está enfocado en solicitudes en Dallas–Fort Worth y comunidades cercanas. La disponibilidad depende de la recogida, el destino y el vehículo; confirma tu traslado con nosotros.' },
    ], related: ['services', 'contact'] },
  },
  contact: {
    en: { nav: 'Contact', title: 'Contact TowTruckOnDemand', description: 'Call TowTruckOnDemand at (210) 806-2061 about a tow request, scheduled pickup or vehicle details. Get a quote online for DFW and nearby areas.', kicker: 'LET’S GET THE DETAILS RIGHT.', heading: 'Have a question about your pickup?', intro: 'Call us about access, vehicle condition, availability or a change to an existing request. For a new trip, you can start with an online quote.', contact: true, sections: [
      { title: 'Changing an existing request', text: 'Have your name, phone number, pickup location and requested date or time ready. Confirm changes with us before expecting a revised pickup.' },
      { title: 'About the time you choose', text: 'All scheduled pickup times are Central Time. Business-hour pricing applies Monday–Saturday, 8:00 AM–6:00 PM. Sunday and outside those hours add $60. Sending a request does not guarantee availability or immediate dispatch.' },
    ], related: ['faq', 'services'] },
    es: { nav: 'Contacto', title: 'Contacta a TowTruckOnDemand', description: 'Llama al (210) 806-2061 para consultar una solicitud, una recogida programada o detalles del vehículo. Cotiza en línea en DFW y alrededores.', kicker: 'ACLAREMOS LOS DETALLES.', heading: '¿Tienes una pregunta sobre tu recogida?', intro: 'Llámanos para consultar acceso, condición del vehículo, disponibilidad o cambios a una solicitud. Para un traslado nuevo puedes empezar con una cotización en línea.', contact: true, sections: [
      { title: 'Cambios a una solicitud existente', text: 'Ten a mano tu nombre, teléfono, lugar de recogida y fecha u hora solicitada. Confirma los cambios con nosotros antes de esperar una recogida diferente.' },
      { title: 'Sobre el horario que seleccionas', text: 'Todos los horarios son de la zona central. Las tarifas habituales aplican de lunes a sábado, de 8:00 a. m. a 6:00 p. m. Los domingos y fuera de horario se agregan $60. Una solicitud no garantiza disponibilidad ni despacho inmediato.' },
    ], related: ['faq', 'services'] },
  },
};

export function rateRows(locale = 'en') {
  const es = locale === 'es';
  return [
    [es ? 'Enganche' : 'Hookup', `$${HOOKUP_FEE}`],
    [es ? 'Por milla facturada, desde la primera' : 'Per billed mile, starting at mile one', `$${PER_MILE}`],
    [es ? 'Cargo mínimo total' : 'Minimum total charge', `$${MINIMUM_CHARGE}`],
    [es ? 'SUV o camioneta pickup' : 'SUV or pickup', '+$15'],
    [es ? 'El vehículo no puede rodar' : 'Vehicle cannot roll', `+$${NON_ROLLING_SURCHARGE}`],
    [es ? 'Fuera de horario o domingo' : 'After hours or Sunday', `+$${AFTER_HOURS_SURCHARGE}`],
  ];
}
