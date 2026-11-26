import { SITE_URL, PAGE_SLUGS, sitePath } from './lib/siteContent';

export default function sitemap() {
  const entries = ['', ...PAGE_SLUGS].flatMap(slug => {
    const languages = { en: `${SITE_URL}${sitePath(slug)}`, es: `${SITE_URL}${sitePath(slug, 'es')}` };
    return ['en', 'es'].map(locale => ({ url: `${SITE_URL}${sitePath(slug, locale)}`, alternates: { languages } }));
  });
  return [...entries, ...['roadside-assistance', 'es/roadside-assistance'].map(slug => ({
    url: `${SITE_URL}/${slug}`,
    alternates: { languages: { en: `${SITE_URL}/roadside-assistance`, es: `${SITE_URL}/es/roadside-assistance` } },
  })), ...['privacy-policy', 'terms'].map(slug => ({ url: `${SITE_URL}/${slug}` }))];
}
