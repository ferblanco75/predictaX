'use client';

import Script from 'next/script';

/**
 * Google Analytics 4 component
 *
 * Loads GA4 tracking scripts only in production environment
 * when NEXT_PUBLIC_GA_MEASUREMENT_ID is set.
 *
 * Usage: Add to layout.tsx inside the <body> tag
 */
export function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  // Only load analytics in production with valid measurement ID
  if (!measurementId || process.env.NODE_ENV !== 'production') {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}
