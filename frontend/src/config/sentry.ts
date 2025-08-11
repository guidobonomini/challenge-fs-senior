import * as Sentry from '@sentry/react';

export const initializeSentry = () => {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN || 'https://6f4982dc6fe258ba9747f6016380063e@o4509812145979392.ingest.us.sentry.io/4509812147879936',
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event, hint) {
      // Filter out authentication errors and other noise
      if (event.exception?.values?.[0]?.value?.includes('Network Error')) {
        return null;
      }
      
      return event;
    },
    beforeBreadcrumb(breadcrumb) {
      // Filter sensitive breadcrumbs
      if (breadcrumb.category === 'fetch' && breadcrumb.data?.url?.includes('/auth/')) {
        return null;
      }
      return breadcrumb;
    },
  });
};

export { Sentry };