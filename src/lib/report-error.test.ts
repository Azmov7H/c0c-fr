import { afterEach, describe, expect, it, vi } from 'vitest';

const sentry = vi.hoisted(() => ({
  init: vi.fn(),
  captureException: vi.fn(),
  getClient: vi.fn(),
}));

vi.mock('@sentry/nextjs', () => ({
  init: sentry.init,
  captureException: sentry.captureException,
  getClient: sentry.getClient,
}));

import { reportClientError } from './report-error';

const DSN = 'https://public@example.invalid/1';

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('reportClientError', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    sentry.init.mockReset();
    sentry.captureException.mockReset();
    sentry.getClient.mockReset();
  });

  it('is a no-op when NEXT_PUBLIC_SENTRY_DSN is unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', '');

    reportClientError(new Error('boom'));
    await settle();

    expect(sentry.init).not.toHaveBeenCalled();
    expect(sentry.captureException).not.toHaveBeenCalled();
  });

  it('initialises with PII collection disabled, then captures', async () => {
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', DSN);
    const error = new Error('boom');

    reportClientError(error);
    await settle();

    expect(sentry.init).toHaveBeenCalledTimes(1);
    expect(sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: DSN,
        tracesSampleRate: 0,
        dataCollection: expect.objectContaining({
          userInfo: false,
          cookies: false,
          httpHeaders: false,
          httpBodies: [],
          urlQueryParams: false,
        }),
      }),
    );
    expect(sentry.captureException).toHaveBeenCalledWith(error);
  });

  it('reuses an already-initialised client instead of calling init twice', async () => {
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', DSN);
    sentry.getClient.mockReturnValue({});
    const error = new Error('boom');

    reportClientError(error);
    await settle();

    expect(sentry.init).not.toHaveBeenCalled();
    expect(sentry.captureException).toHaveBeenCalledWith(error);
  });

  it('swallows an init failure so the fallback UI still renders', async () => {
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', DSN);
    sentry.init.mockImplementationOnce(() => {
      throw new Error('transport unavailable');
    });

    expect(() => reportClientError(new Error('boom'))).not.toThrow();
    await settle();

    expect(sentry.captureException).not.toHaveBeenCalled();
  });
});
