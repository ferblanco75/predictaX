import type { Metadata } from 'next';

import { HomePageClient } from '@/components/home/HomePageClient';
import { StructuredData } from '@/components/seo/StructuredData';
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
  return (
    <>
      <StructuredData data={generateOrganizationStructuredData()} />
      <HomePageClient />
    </>
  );
}
