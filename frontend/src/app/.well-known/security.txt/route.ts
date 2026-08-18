import { CANONICAL_BASE_URL } from '@/lib/site';

export const dynamic = 'force-static';

export function GET() {
  const body = [
    `Contact: mailto:security@neuropredict.io`,
    `Expires: 2027-05-21T00:00:00Z`,
    `Preferred-Languages: es, en`,
    `Canonical: ${CANONICAL_BASE_URL}/.well-known/security.txt`,
    `Policy: ${CANONICAL_BASE_URL}/security-policy`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
