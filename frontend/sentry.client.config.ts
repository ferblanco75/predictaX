import * as Sentry from '@sentry/nextjs';

const CONSENT_STORAGE_KEY = 'predictax_cookie_consent';
const CONSENT_VERSION = '2026-05-21';

function hasAnalyticsConsent() {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const rawConsent = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!rawConsent) {
      return false;
    }

    const consent = JSON.parse(rawConsent) as { analytics?: boolean; version?: string };
    return consent.analytics === true && consent.version === CONSENT_VERSION;
  } catch {
    return false;
  }
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production, or using tracesSampler for finer control
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Set the environment
  environment: process.env.NODE_ENV,

  // Enable client-side Sentry only after explicit analytics consent.
  enabled:
    process.env.NODE_ENV === 'production' &&
    Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN) &&
    hasAnalyticsConsent(),

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  replaysSessionSampleRate: 0.1,

  // If the entire session is not sampled, use the below sample rate to sample sessions when an error occurs:
  replaysOnErrorSampleRate: 1.0,

  // Integrations
  integrations: [
    Sentry.replayIntegration({
      // Additional SDK configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
