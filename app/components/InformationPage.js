import SiteMenu from './SiteMenu';
import SiteFooter from './SiteFooter';
import { pages, sitePath, PHONE, PHONE_HREF, rateRows } from '../lib/siteContent';

export default function InformationPage({ slug, locale = 'en' }) {
  const page = pages[slug][locale];
  const es = locale === 'es';
  return (
    <main lang={locale}>
      <a className="skipLink" href="#info-content">{es ? "Ir al contenido" : "Skip to content"}</a>
      <header className="nav infoNav">
        <a href={sitePath('', locale)} className="brand"><span className="brandTop">TowTruck</span><span className="brandBottom">OnDemand</span></a>
        <SiteMenu locale={locale} />
        <a href={sitePath(slug, es ? 'en' : 'es')} hrefLang={es ? 'en' : 'es'} className="callLink languageLink">{es ? 'English' : 'Español'}</a>
        <a className="callLink" href={PHONE_HREF}>{es ? 'Llámanos' : 'Call us'}</a>
      </header>
      <div className="infoLayout sectionWidth">
        <article id="info-content">
          <nav className="breadcrumbs" aria-label={es ? 'Ruta de navegación' : 'Breadcrumb'}><a href={sitePath('', locale)}>{es ? 'Inicio' : 'Home'}</a><span aria-hidden="true">/</span><span aria-current="page">{page.nav}</span></nav>
          <header className="infoHero"><p className="sectionKicker">{page.kicker}</p><h1>{page.heading}</h1><p className="infoIntro">{page.intro}</p></header>
          {page.contact && <div className="contactCallout"><span>{es ? 'Hablemos de tu traslado' : 'Let’s talk about your trip'}</span><a href={PHONE_HREF}>{PHONE} <span aria-hidden="true">↗</span></a><p>{es ? 'Para cambios en una solicitud, llámanos directamente.' : 'For changes to an existing request, call us directly.'}</p></div>}
          {page.rates && <section className="ratesPanel" aria-labelledby="rates-heading"><h2 id="rates-heading">{es ? 'Las tarifas, de un vistazo' : 'The rates at a glance'}</h2><dl>{rateRows(locale).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p>{es ? 'El mínimo se aplica al total calculado del servicio.' : 'The minimum applies to the calculated service total.'}</p></section>}
          {page.questions && <section className="faqList" aria-label={es ? 'Preguntas frecuentes' : 'Frequently asked questions'}>{page.questions.map(([question, answer], i) => <details key={question} open={i === 0}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</section>}
          {page.sections && <div className="infoSections">{page.sections.map((section, i) => <section key={section.title}><span className="infoSectionNumber" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span><div><h2>{section.title}</h2><p>{section.text}</p></div></section>)}</div>}
          <nav className="relatedLinks" aria-label={es ? 'Sigue explorando' : 'Keep exploring'}><span>{es ? 'También te puede ayudar' : 'You might also find helpful'}</span>{page.related.map(related => <a key={related} href={sitePath(related, locale)}>{pages[related][locale].nav} <span aria-hidden="true">↗</span></a>)}</nav>
        </article>
        <aside className="infoAside"><div className="asideCard"><span className="asideIcon" aria-hidden="true">↗</span><h2>{es ? '¿Listo para el siguiente paso?' : 'Ready for the next step?'}</h2><p>{es ? 'Ingresa la recogida y el destino. Consulta tu precio antes de solicitar el servicio.' : 'Enter your pickup and destination. See your price before you request service.'}</p><a className="primary ctaLink" href={`${sitePath('', locale)}#booking`}>{es ? 'Cotizar mi grúa' : 'Get my towing price'} <span aria-hidden="true">→</span></a><a className="asidePhone" href={PHONE_HREF}>{es ? 'O llama al' : 'Or call'} {PHONE}</a><div className="asideNote">{es ? 'Pago al recoger. Confirmamos disponibilidad antes del despacho.' : 'Pay at pickup. We confirm availability before dispatch.'}</div></div></aside>
      </div>
      <SiteFooter locale={locale} />
    </main>
  );
}
