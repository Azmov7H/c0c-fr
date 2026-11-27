// @vitest-environment jsdom
/** AR-039 — the switcher's click-time preference sync stays tiny and safe. */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { isAuthenticated, markAuthenticated } from '@/features/auth/lib/auth-presence';
import { syncLocalePreference } from './locale-preference-sync';

vi.mock('@/features/auth/lib/auth-presence', () => ({
    isAuthenticated: vi.fn(),
    markAuthenticated: vi.fn(),
}));

const authed = vi.mocked(isAuthenticated);
const mark = vi.mocked(markAuthenticated);

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
    });
}

describe('syncLocalePreference', () => {
    afterEach(() => {
        vi.clearAllMocks();
        vi.unstubAllGlobals();
    });

    it('patches directly when the session initializer already resolved auth', async () => {
        authed.mockReturnValue(true);
        const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: { locale: 'ar' } }));
        vi.stubGlobal('fetch', fetchMock);

        syncLocalePreference('ar');
        await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

        expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/users/profile/preferences/locale');
        expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'PATCH' });
        expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ locale: 'ar' });
    });

    it('probes the session on a marketing route, then patches once', async () => {
        authed.mockReturnValue(false);
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(jsonResponse({ data: { authenticated: true } }))
            .mockResolvedValueOnce(jsonResponse({ data: { locale: 'ar' } }));
        vi.stubGlobal('fetch', fetchMock);

        syncLocalePreference('ar');
        await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

        expect(fetchMock.mock.calls[0][0]).toBe('/api/auth/session');
        expect(mark).toHaveBeenCalledWith(true);
        expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/users/profile/preferences/locale');
    });

    it('a guest never reaches the preference endpoint', async () => {
        authed.mockReturnValue(false);
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(jsonResponse({ data: { authenticated: false } }));
        vi.stubGlobal('fetch', fetchMock);

        syncLocalePreference('ar');
        await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

        expect(fetchMock.mock.calls.map((call) => call[0])).toEqual(['/api/auth/session']);
    });

    it('a failing PATCH is swallowed — navigation is already under way', async () => {
        authed.mockReturnValue(true);
        const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}, 500));
        vi.stubGlobal('fetch', fetchMock);

        expect(() => syncLocalePreference('en')).not.toThrow();
        await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    });
});
