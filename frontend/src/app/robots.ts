import { MetadataRoute } from 'next';

import { CANONICAL_BASE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/monitoring'],
      },
    ],
    sitemap: `${CANONICAL_BASE_URL}/sitemap.xml`,
  };
}
