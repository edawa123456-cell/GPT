import { sitePath } from '../lib/siteContent';

export default function HomeDiscover({ locale = 'en' }) {
  const es = locale === 'es';
  const cards = es ? [
    { slug: 'pricing', tag: 'SIN ADIVINAR', title: '¿Qué incluye tu precio?', text: 'Enganche, millas y suplementos, explicados.', icon: '$' },
    { slug: 'towing-guide', tag: 'ANTES DE LA RECOGIDA', title: 'Los detalles que ayudan.', text: 'Una guía corta para preparar tu traslado.', icon: '↗' },
    { slug: 'faq', tag: 'RESPUESTAS CLARAS', title: '¿Tienes alguna pregunta?', text: 'Horarios, ubicación y pago al recoger.', icon: '?' },
  ] : [
    { slug: 'pricing', tag: 'LESS GUESSWORK', title: 'What goes into your price?', text: 'Hookup, mileage and additions, explained.', icon: '$' },
    { slug: 'towing-guide', tag: 'BEFORE THE PICKUP', title: 'The little details that help.', text: 'A short guide to getting your trip ready.', icon: '↗' },
    { slug: 'faq', tag: 'CLEAR ANSWERS', title: 'Still have a question?', text: 'Scheduling, pickup locations and payment.', icon: '?' },
  ];
  return (
    <section className="discover sectionWidth" aria-labelledby="discover-title">
      <div className="sectionHeading"><div><span className="sectionKicker">{es ? 'UN POCO DE CLARIDAD' : 'A LITTLE CLARITY'}</span><h2 id="discover-title">{es ? 'Todo más claro antes de reservar.' : 'Feel ready before you book.'}</h2></div><a className="textLink" href={sitePath('about', locale)}>{es ? 'Conócenos' : 'Meet TowTruckOnDemand'} <span aria-hidden="true">↗</span></a></div>
      <div className="discoverGrid">{cards.map(card => <a className="discoverCard" key={card.slug} href={sitePath(card.slug, locale)}><span className="cardIcon" aria-hidden="true">{card.icon}</span><span className="cardTag">{card.tag}</span><h3>{card.title}</h3><p>{card.text}</p><span className="cardArrow" aria-hidden="true">↗</span></a>)}</div>
    </section>
  );
}
