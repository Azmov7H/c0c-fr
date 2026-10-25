import { afterEach, describe, expect, it, vi } from 'vitest';

import { trackEvent } from './analytics';

/**
 * T18 — the analytics seam (T12): completion events only, never field
 * contents. The dev-console branch is the pre-T21 provider plug point; the
 * allowlist is the privacy contract.
 */
describe('trackEvent', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    it('logs the event name only (no payload) in development', () => {
        vi.stubEnv('NODE_ENV', 'development');
        const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});

        trackEvent('signup_completed');

        expect(debug).toHaveBeenCalledTimes(1);
        expect(debug.mock.calls[0][0]).not.toContain('password');
        expect(String(debug.mock.calls[0][0])).toContain('signup_completed');
    });

    it('completes silently outside development (no provider wired yet)', () => {
        const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});

        trackEvent('password_reset_completed');

        expect(debug).not.toHaveBeenCalled();
    });

    it('refuses events outside the allowlist — even cast ones', () => {
        vi.stubEnv('NODE_ENV', 'development');
        const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});

        trackEvent('password_field_contents' as never);

        expect(debug).not.toHaveBeenCalled();
    });
});
