'use client';

import { useEffect } from 'react';
import { reportClientError } from '@/lib/report-error';

/**
 * T21 — last-resort boundary for errors thrown in the root layout or in a
 * route group that has no closer `error.tsx`. It replaces the root layout, so
 * it must render its own <html>/<body> and cannot rely on the app's Tailwind
 * stylesheet being loaded. Keep it dependency-free and inline-styled.
 *
 * The reporter is lazy (see `src/lib/report-error.ts`): the Sentry browser SDK
 * is fetched only when this boundary actually renders.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0b0b0f',
          color: '#f5f5f7',
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        <main
          style={{
            width: '100%',
            maxWidth: '28rem',
            margin: '1.5rem',
            padding: '2rem',
            borderRadius: '0.75rem',
            border: '1px solid #2a2a33',
            background: '#141419',
            textAlign: 'center',
          }}
        >
          <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem' }}>
            Something went wrong
          </h1>
          <p style={{ margin: '0 0 1rem', color: '#a1a1aa', lineHeight: 1.5 }}>
            The app hit an unexpected error. Reloading usually clears it; if it
            keeps happening, contact support with the reference below.
          </p>
          {error.digest ? (
            <p style={{ margin: '0 0 1.5rem', color: '#a1a1aa', fontSize: '0.75rem' }}>
              Support reference:{' '}
              <code
                style={{
                  padding: '0.125rem 0.375rem',
                  borderRadius: '0.25rem',
                  background: '#27272f',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                }}
              >
                {error.digest}
              </code>
            </p>
          ) : null}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              justifyContent: 'center',
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                cursor: 'pointer',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid #6d5efc',
                background: '#6d5efc',
                color: '#fff',
                font: 'inherit',
                fontSize: '0.875rem',
              }}
            >
              Try again
            </button>
            {/* A full reload is intentional: a root-level error may have left
                the client router in a state a soft navigation cannot trust. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid #3f3f4a',
                color: '#f5f5f7',
                fontSize: '0.875rem',
                textDecoration: 'none',
              }}
            >
              Back to home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
