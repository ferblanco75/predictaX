export const CANONICAL_BASE_URL = 'https://www.neuropredict.io';
export const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || CANONICAL_BASE_URL;

export function canonicalUrl(path: string = '/') {
  return new URL(path, CANONICAL_BASE_URL).toString();
}
