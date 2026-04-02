/**
 * Analytics Utility Module
 *
 * Provides type-safe functions for tracking events with Google Analytics
 * and other analytics platforms.
 */

// Extend Window interface to include gtag function
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Predefined analytics events
 * Add new events here as the application grows
 */
export const analyticsEvents = {
  // Waitlist events
  WAITLIST_JOINED: 'waitlist_joined',
  WAITLIST_FORM_ERROR: 'waitlist_form_error',

  // Prediction events
  PREDICTION_SUBMITTED: 'prediction_submitted',
  PREDICTION_ERROR: 'prediction_error',

  // Market events
  MARKET_VIEWED: 'market_viewed',
  MARKET_SHARED: 'market_shared',
  MARKET_SEARCHED: 'market_searched',

  // Navigation events
  CATEGORY_CLICKED: 'category_clicked',
  EXTERNAL_LINK_CLICKED: 'external_link_clicked',

  // Auth events
  LOGIN_CLICKED: 'login_clicked',
  REGISTER_CLICKED: 'register_clicked',
} as const;

/**
 * Track a custom event with Google Analytics
 *
 * @param eventName - Name of the event to track
 * @param properties - Optional properties to attach to the event
 *
 * @example
 * trackEvent(analyticsEvents.WAITLIST_JOINED, {
 *   email: 'user@example.com',
 *   source: 'homepage'
 * });
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, any>
): void {
  // Only track in browser environment
  if (typeof window === 'undefined') {
    return;
  }

  // Check if gtag is available
  if (!window.gtag) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] Event tracked:', eventName, properties);
    }
    return;
  }

  // Send event to Google Analytics
  try {
    window.gtag('event', eventName, properties);
  } catch (error) {
    console.error('[Analytics] Error tracking event:', error);
  }
}

/**
 * Track a page view
 *
 * @param url - The page URL to track
 *
 * @example
 * trackPageView('/about');
 */
export function trackPageView(url: string): void {
  // Only track in browser environment
  if (typeof window === 'undefined') {
    return;
  }

  // Check if gtag is available
  if (!window.gtag) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] Page view tracked:', url);
    }
    return;
  }

  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!measurementId) {
    return;
  }

  // Send page view to Google Analytics
  try {
    window.gtag('config', measurementId, {
      page_path: url,
    });
  } catch (error) {
    console.error('[Analytics] Error tracking page view:', error);
  }
}

/**
 * Track a conversion event
 *
 * @param value - The monetary value of the conversion
 * @param currency - The currency code (default: 'USD')
 *
 * @example
 * trackConversion(100, 'USD');
 */
export function trackConversion(value: number, currency: string = 'USD'): void {
  trackEvent('conversion', {
    value,
    currency,
  });
}

/**
 * Track user timing (performance metrics)
 *
 * @param name - Name of the timing metric
 * @param value - Time value in milliseconds
 * @param category - Optional category
 *
 * @example
 * trackTiming('load_time', 1250, 'page_load');
 */
export function trackTiming(
  name: string,
  value: number,
  category?: string
): void {
  trackEvent('timing_complete', {
    name,
    value,
    event_category: category,
  });
}
