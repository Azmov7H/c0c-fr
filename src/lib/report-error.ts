/**
 * T21 — lazy client-side error reporting.
 *
 * The Sentry browser SDK is intentionally **not** part of the first-load
 * bundle: T20's landing budget has only a few kB of headroom, and reporting is
 * only useful after an error has already happened. `import()` puts the SDK in
 * an async chunk that is fetched from an error boundary and never on a healthy
 * page load.
 *
 * With `NEXT_PUBLIC_SENTRY_DSN` unset this is a no-op — no chunk, no network
 * call, no console noise. `sendDefaultPii: false` keeps request/cookie data
 * out of events.
 */
export function reportClientError(error: Error & { digest?: string }): void {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  void import('@sentry/nextjs')
    .then((Sentry) => {
      if (!Sentry.getClient()) {
        Sentry.init({
          dsn,
          environment:
            process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
          tracesSampleRate: 0,
          dataCollection: {
            userInfo: false,
            cookies: false,
            httpHeaders: false,
            httpBodies: [],
            urlQueryParams: false,
          },
          initialScope: { tags: { service: 'c0c-fr' } },
        });
      }
      Sentry.captureException(error);
    })
    .catch(() => {
      // Reporting is best-effort: it must never mask the original error or
      // break the fallback UI.
    });
}
