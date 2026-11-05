import type { Instrumentation } from 'next';

/**
 * T21 — server-side error reporting.
 *
 * The SDK is imported dynamically and only when `SENTRY_DSN` is set. An unset
 * DSN therefore costs nothing at runtime and cannot produce a half-configured
 * client; the app keeps booting even if the Sentry package itself is missing.
 *
 * `tracesSampleRate` defaults to 0 (errors only). Set
 * `SENTRY_TRACES_SAMPLE_RATE` between 0 and 1 to sample requests as well.
 */
const dsn = (): string | undefined => process.env.SENTRY_DSN;

const tracesSampleRate = (): number => {
  const parsed = Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0');
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(Math.max(parsed, 0), 1);
};

export async function register(): Promise<void> {
  if (!dsn()) return;

  try {
    // Sentry's Node client requires this package at module load, and its own
    // docs say it must stay external when a server is bundled. Importing it
    // explicitly makes Next trace it (and its deps) into `.next/standalone`;
    // without this the SDK boots but cannot register diagnostics hooks.
    await import('@sentry/server-runtime-injection/register');
    const Sentry = await import('@sentry/nextjs');
    Sentry.init({
      dsn: dsn(),
      environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
      release: process.env.SENTRY_RELEASE,
      tracesSampleRate: tracesSampleRate(),
      // Error events must not become a PII export: request bodies, cookies,
      // headers and query strings are not collected. The logging layer already
      // redacts them; this closes the same hole in the reporting path.
      dataCollection: {
        userInfo: false,
        cookies: false,
        httpHeaders: false,
        httpBodies: [],
        urlQueryParams: false,
      },
      initialScope: { tags: { service: 'c0c-fr' } },
    });
  } catch (error) {
    // Reporting is best-effort. A broken transport must never prevent the
    // server from starting.
    console.warn(
      '[sentry] server reporting disabled:',
      error instanceof Error ? error.message : 'unknown error',
    );
  }
}

/**
 * Next calls this for every unhandled error in a route handler, server
 * component, server action or proxy. It is the server-side counterpart of the
 * client reporter in `src/lib/report-error.ts`.
 */
export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  if (!dsn()) return;

  try {
    const Sentry = await import('@sentry/nextjs');
    Sentry.captureRequestError(error, request, context);
  } catch {
    // Never let the reporter throw while handling an error.
  }
};
