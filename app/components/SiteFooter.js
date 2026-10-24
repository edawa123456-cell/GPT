import { PAGE_SLUGS, pages, sitePath, PHONE, PHONE_HREF, SOCIAL_LINKS } from '../lib/siteContent';

export default function SiteFooter({ locale = 'en' }) {
  const es = locale === 'es';
  return (
    <footer className="siteFooter">
      <div className="footerGrid">
        <div className="footerIntro">
          <a href={sitePath('', locale)} className="footerBrand">TowTruck<span>OnDemand</span></a>
          <p>{es ? 'Tu ruta. Un precio claro. El siguiente paso, más sencillo.' : 'Your route. A clear price. An easier next step.'}</p>
          <span className="footerArea">{es ? 'DFW y alrededores' : 'DFW & surrounding areas'}</span>
        </div>
        <nav aria-label={es ? 'Enlaces útiles' : 'Helpful links'}>
          <strong>{es ? 'Antes de reservar' : 'Before you book'}</strong>
          {PAGE_SLUGS.slice(0, 4).map(slug => <a key={slug} href={sitePath(slug, locale)}>{pages[slug][locale].nav}</a>)}
        </nav>
        <nav aria-label={es ? 'Nuestra información' : 'Our information'}>
          <strong>{es ? 'Hablemos' : 'Let’s talk'}</strong>
          <a href={sitePath('about', locale)}>{pages.about[locale].nav}</a>
          <a href={sitePath('contact', locale)}>{pages.contact[locale].nav}</a>
          <a href={PHONE_HREF} className="footerPhone">{PHONE}</a>
          {SOCIAL_LINKS.length > 0 && <div className="socialLinks" aria-label={es ? 'Redes sociales' : 'Social media'}>{SOCIAL_LINKS.map(({ name, url }) => <a key={name} href={url} target="_blank" rel="noopener noreferrer">{name}<span className="srOnly">{es ? ' (abre en otra pestaña)' : ' (opens in a new tab)'}</span><span aria-hidden="true"> ↗</span></a>)}</div>}
        </nav>
      </div>
      <div className="footerBottom">
        <span>© {new Date().getFullYear()} TowTruckOnDemand</span>
        <div><a href="/privacy-policy">{es ? 'Privacidad (en inglés)' : 'Privacy'}</a><a href="/terms">{es ? 'Términos (en inglés)' : 'Terms'}</a><a href={es ? '/' : '/es'}>{es ? 'English' : 'Español'}</a></div>
      </div>
    </footer>
  );
}
