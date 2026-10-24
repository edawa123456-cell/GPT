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
          {SOCIAL_LINKS.length > 0 && <div className="socialLinks" aria-label={es ? 'Redes sociales' : 'Social media'}>{SOCIAL_LINKS.map(({ name, url }) => <a key={name} href={url} target="_blank" rel="noopener noreferrer">{name === 'Facebook' && <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ verticalAlign: 'middle', marginRight: 6 }}><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.62.77-1.62 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12Z" /></svg>}{name}<span className="srOnly">{es ? ' (abre en otra pestaña)' : ' (opens in a new tab)'}</span><span aria-hidden="true"> ↗</span></a>)}</div>}
        </nav>
      </div>
      <div className="footerBottom">
        <span>© {new Date().getFullYear()} TowTruckOnDemand</span>
        <div><a href="/privacy-policy">{es ? 'Privacidad (en inglés)' : 'Privacy'}</a><a href="/terms">{es ? 'Términos (en inglés)' : 'Terms'}</a><a href={es ? '/' : '/es'}>{es ? 'English' : 'Español'}</a></div>
      </div>
    </footer>
  );
}
