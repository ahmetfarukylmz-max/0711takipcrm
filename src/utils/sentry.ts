import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry Error Tracking
 *
 * To enable Sentry:
 * 1. Create a Sentry account at https://sentry.io
 * 2. Create a new React project
 * 3. Copy your DSN key
 * 4. Add VITE_SENTRY_DSN to your .env file
 * 5. Uncomment the Sentry.init() call below
 *
 * Environment variables required:
 * - VITE_SENTRY_DSN: Your Sentry DSN key
 * - VITE_SENTRY_ENVIRONMENT: Environment name (development, staging, production)
 */
export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development';

  // Only initialize if DSN is provided
  if (dsn && import.meta.env.PROD) {
    Sentry.init({
      dsn,
      environment,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      // Performance Monitoring
      tracesSampleRate: 1.0, // Capture 100% of transactions (adjust in production)
      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
      // Ignore common errors
      ignoreErrors: ['ResizeObserver loop limit exceeded', 'Non-Error promise rejection captured'],
    });

    console.log('✅ Sentry initialized');
  } else if (!import.meta.env.PROD) {
    console.log('ℹ️ Sentry disabled in development');
  } else {
    console.warn('⚠️ Sentry DSN not configured. Add VITE_SENTRY_DSN to .env');
  }
};

/**
 * Capture an exception manually
 */
export const captureException = (error: Error, context?: Record<string, any>) => {
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error('Error:', error, context);
  }
};

/**
 * Set user context for error tracking
 */
export const setUser = (user: { id: string; email?: string; username?: string }) => {
  if (import.meta.env.PROD) {
    Sentry.setUser(user);
  }
};

/**
 * Clear user context (on logout)
 */
export const clearUser = () => {
  if (import.meta.env.PROD) {
    Sentry.setUser(null);
  }
};
