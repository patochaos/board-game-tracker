/**
 * Analytics utility for tracking events in the VTES Guess game
 * Supports Google Analytics, Plausible, and custom analytics providers
 */

// Event types for the VTES guess game
type VtesGuessEvent =
  | 'game_start'
  | 'game_complete'
  | 'score_submit'
  | 'share_click'
  | 'mode_select'
  | 'card_answer'
  | 'skip_click';

// Event parameters interface
interface EventParams {
  [key: string]: string | number | boolean | undefined;
}

// Analytics configuration
interface AnalyticsConfig {
  googleAnalyticsId?: string;
  plausibleDomain?: string;
  customEndpoint?: string;
  debug?: boolean;
}

// Global analytics configuration
let config: AnalyticsConfig = {
  debug: process.env.NODE_ENV === 'development',
};

/**
 * Initialize analytics with configuration
 */
export function initAnalytics(analyticsConfig: AnalyticsConfig): void {
  config = { ...config, ...analyticsConfig };

  if (config.debug) {
    console.log('[Analytics] Initialized with config:', config);
  }

  // Initialize Google Analytics if ID is provided
  if (config.googleAnalyticsId && typeof window !== 'undefined') {
    initGoogleAnalytics(config.googleAnalyticsId);
  }

  // Initialize Plausible if domain is provided
  if (config.plausibleDomain && typeof window !== 'undefined') {
    initPlausible(config.plausibleDomain);
  }
}

/**
 * Initialize Google Analytics
 */
function initGoogleAnalytics(gaId: string): void {
  if (typeof window === 'undefined') return;

  // Load GA script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', gaId, {
    send_page_view: false, // We'll handle page views manually
  });

  if (config.debug) {
    console.log('[Analytics] Google Analytics initialized:', gaId);
  }
}

/**
 * Initialize Plausible Analytics
 */
function initPlausible(domain: string): void {
  if (typeof window === 'undefined') return;

  const script = document.createElement('script');
  script.defer = true;
  script.setAttribute('data-domain', domain);
  script.src = 'https://plausible.io/js/script.js';
  document.head.appendChild(script);

  if (config.debug) {
    console.log('[Analytics] Plausible initialized:', domain);
  }
}

/**
 * Track a custom event
 */
export function trackEvent(
  eventName: VtesGuessEvent,
  params?: EventParams
): void {
  if (typeof window === 'undefined') return;

  const eventData = {
    event: eventName,
    timestamp: new Date().toISOString(),
    ...params,
  };

  // Log to console in debug mode
  if (config.debug) {
    console.log('[Analytics] Event:', eventName, params);
  }

  // Send to Google Analytics
  if (window.gtag && config.googleAnalyticsId) {
    window.gtag('event', eventName, {
      ...params,
      event_category: 'vtes_guess',
    });
  }

  // Send to Plausible
  if (window.plausible && config.plausibleDomain) {
    window.plausible(eventName, { props: params });
  }

  // Send to custom endpoint
  if (config.customEndpoint) {
    sendToCustomEndpoint(eventData);
  }
}

/**
 * Track a page view
 */
export function trackPageView(
  pagePath?: string,
  pageTitle?: string
): void {
  if (typeof window === 'undefined') return;

  const path = pagePath || window.location.pathname;
  const title = pageTitle || document.title;

  if (config.debug) {
    console.log('[Analytics] Page view:', path, title);
  }

  // Google Analytics
  if (window.gtag && config.googleAnalyticsId) {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title,
      page_location: window.location.href,
    });
  }

  // Plausible
  if (window.plausible && config.plausibleDomain) {
    window.plausible('pageview', { u: window.location.href });
  }
}

/**
 * Send event data to custom analytics endpoint
 */
async function sendToCustomEndpoint(eventData: Record<string, unknown>): Promise<void> {
  if (!config.customEndpoint) return;

  try {
    await fetch(config.customEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
      // Use keepalive for events sent during page unload
      keepalive: true,
    });
  } catch (error) {
    if (config.debug) {
      console.error('[Analytics] Failed to send to custom endpoint:', error);
    }
  }
}

/**
 * Convenience methods for specific VTES guess game events
 */

export function trackGameStart(params: {
  mode: 'normal' | 'ranked';
  difficulty?: number;
  cardType?: string;
}): void {
  trackEvent('game_start', params);
}

export function trackGameComplete(params: {
  mode: 'normal' | 'ranked';
  score: number;
  correct: number;
  total: number;
  bestStreak: number;
  accuracy: number;
}): void {
  trackEvent('game_complete', params);
}

export function trackScoreSubmit(params: {
  score: number;
  rank?: number;
  isNewRecord: boolean;
}): void {
  trackEvent('score_submit', params);
}

export function trackShareClick(params: {
  mode: 'normal' | 'ranked';
  score?: number;
  platform?: string;
}): void {
  trackEvent('share_click', params);
}

export function trackModeSelect(params: {
  mode: 'normal' | 'ranked';
  source: 'landing_page' | 'settings';
}): void {
  trackEvent('mode_select', params);
}

export function trackCardAnswer(params: {
  mode: 'normal' | 'ranked';
  result: 'correct' | 'incorrect' | 'timeout';
  cardType: 'library' | 'crypt';
  difficulty: number;
  cardId: string;
  points?: number;
  streak?: number;
}): void {
  trackEvent('card_answer', params);
}

export function trackSkipClick(params: {
  mode: 'normal' | 'ranked';
  cardType: 'library' | 'crypt';
  difficulty: number;
}): void {
  trackEvent('skip_click', params);
}

// Type definitions for global window object
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    plausible: (eventName: string, options?: { props?: EventParams; u?: string }) => void;
  }
}
