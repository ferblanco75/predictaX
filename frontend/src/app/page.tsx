import type { Metadata } from 'next';

import { HomePageClient } from '@/components/home/HomePageClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { canonicalUrl } from '@/lib/site';
import { generateOrganizationStructuredData } from '@/lib/utils/structured-data';

export const metadata: Metadata = {
  alternates: {
    canonical: canonicalUrl('/'),
  },
  openGraph: {
    url: canonicalUrl('/'),
  },
};

export default function Home() {
  const organizationData = generateOrganizationStructuredData();

  return (
    <>
      <JsonLd data={organizationData} />
      <HomePageClient />
    </>
  );
}
