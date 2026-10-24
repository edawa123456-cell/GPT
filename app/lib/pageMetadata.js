import { pages, sitePath, SITE_URL } from './siteContent';

export function informationMetadata(slug, locale = 'en') {
  const page = pages[slug]?.[locale];
  if (!page) return {};
  const canonical = `${SITE_URL}${sitePath(slug, locale)}`;
  return {
    title: `${page.title} | TowTruckOnDemand`, description: page.description,
    alternates: { canonical, languages: { en: `${SITE_URL}${sitePath(slug)}`, es: `${SITE_URL}${sitePath(slug, 'es')}`, 'x-default': `${SITE_URL}${sitePath(slug)}` } },
    openGraph: { title: page.title, description: page.description, url: canonical, siteName: 'TowTruckOnDemand', type: 'website', locale: locale === 'es' ? 'es_US' : 'en_US', images: [{ url: '/tow-truck-fleet.png', alt: 'TowTruckOnDemand fleet' }] },
  };
}
