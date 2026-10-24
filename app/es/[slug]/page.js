import { notFound } from 'next/navigation';
import InformationPage from '../../components/InformationPage';
import { PAGE_SLUGS } from '../../lib/siteContent';
import { informationMetadata } from '../../lib/pageMetadata';

export const dynamicParams = false;
export function generateStaticParams() { return PAGE_SLUGS.map(slug => ({ slug })); }
export async function generateMetadata({ params }) { return informationMetadata((await params).slug, 'es'); }
export default async function Page({ params }) {
  const { slug } = await params;
  if (!PAGE_SLUGS.includes(slug)) notFound();
  return <InformationPage slug={slug} locale="es" />;
}
