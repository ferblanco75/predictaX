import type { Metadata } from 'next';

import { HomePageClient } from '@/components/home/HomePageClient';
import { canonicalUrl } from '@/lib/site';

export const metadata: Metadata = {
  alternates: {
    canonical: canonicalUrl('/'),
  },
  openGraph: {
    url: canonicalUrl('/'),
  },
};

export default function Home() {
  return <HomePageClient />;
}
