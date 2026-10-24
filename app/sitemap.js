import { SITE_URL, PAGE_SLUGS, sitePath } from './lib/siteContent';

export default function sitemap() {
  const entries = ['', ...PAGE_SLUGS].flatMap(slug => {
    const languages = { en: `${SITE_URL}${sitePath(slug)}`, es: `${SITE_URL}${sitePath(slug, 'es')}` };
    return ['en', 'es'].map(locale => ({ url: `${SITE_URL}${sitePath(slug, locale)}`, alternates: { languages } }));
  });
  return [...entries, ...['privacy-policy', 'terms'].map(slug => ({ url: `${SITE_URL}/${slug}` }))];
}
