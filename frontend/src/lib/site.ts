export const CANONICAL_BASE_URL = 'https://www.neuropredict.io';
export const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || CANONICAL_BASE_URL;

export function canonicalUrl(path: string = '/') {
  return new URL(path, CANONICAL_BASE_URL).toString();
}

const OG_IMAGE_URL = '/icons/icon-512.png';

/**
 * Shared Open Graph fields. Next *replaces* the parent `openGraph` object
 * instead of merging it, so a page declaring its own `openGraph: { url }`
 * silently dropped the layout's images, siteName and locale — the site served
 * no og:image at all. Pages spread this and add their own title, description,
 * url and type.
 */
export const openGraphDefaults = {
  locale: 'es_LA',
  siteName: 'NeuroPredict',
  images: [
    {
      url: OG_IMAGE_URL,
      width: 512,
      height: 512,
      alt: 'NeuroPredict - Mercados de Predicción',
    },
  ],
};

/** Same replacement rule applies to `twitter`: a page-level card drops the
 *  layout's images unless it repeats them. */
export const twitterImages = [OG_IMAGE_URL];
