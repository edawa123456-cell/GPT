import { PAGE_SLUGS, pages, sitePath } from '../lib/siteContent';

export default function SiteMenu({ locale = 'en' }) {
  return (
    <details className="siteMenu">
      <summary aria-label={locale === 'es' ? 'Explorar el sitio' : 'Explore the site'}>
        <span>{locale === 'es' ? 'Explorar' : 'Explore'}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </summary>
      <nav aria-label={locale === 'es' ? 'Información' : 'Information'}>
        {PAGE_SLUGS.map(slug => <a key={slug} href={sitePath(slug, locale)}>{pages[slug][locale].nav}<span aria-hidden="true">↗</span></a>)}
      </nav>
    </details>
  );
}
