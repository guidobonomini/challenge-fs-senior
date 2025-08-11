import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export const initializeSentry = () => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || 'https://6f4982dc6fe258ba9747f6016380063e@o4509812145979392.ingest.us.sentry.io/4509812147879936',
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
      Sentry.postgresIntegration(),
      Sentry.onUncaughtExceptionIntegration({
        onFatalError: (err) => {
          console.error('Fatal error:', err);
          process.exit(1);
        },
      }),
      // Add profiling integration for performance monitoring
      ...(process.env.NODE_ENV === 'production' ? [nodeProfilingIntegration()] : []),
    ],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    beforeSend(event, hint) {
      // Filter out health check errors and other noise
      if (event.request?.url?.includes('/health')) {
        return null;
      }
      
      // Don't send authentication errors to Sentry
      if (event.exception?.values?.[0]?.value?.includes('Invalid token')) {
        return null;
      }
      
      return event;
    },
  });
};

export { Sentry };