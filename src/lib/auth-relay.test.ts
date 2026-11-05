import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    createAuthReference,
    extractRefreshToken,
    getSetCookieHeaders,
    relayAuthRequest,
    relayFailure,
    relayUnreachable,
} from './auth-relay';

/**
 * auth-relay keeps the failure envelope identical across the T12 auth BFF
 * routes. The envelope IS the contract here: 4xx stays clean of support
 * references, 5xx/network carries a reference and logs it, and the refresh
 * token is promoted from the backend-scoped cookie to a BFF cookie
 * (see extractRefreshToken).
 */
describe('auth-relay.request relay', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
        global.fetch = originalFetch;
        vi.restoreAllMocks();
    });

    it('posts the body as JSON to SERVER_API_URL with the bearer attached', async () => {
        const responses: Array<Record<string, unknown>> = [];
        global.fetch = vi.fn(async (_url, init) => {
            responses.push({
                url: String(_url),
                headers: (init as RequestInit).headers,
                body: (init as RequestInit).body,
            });
            return new Response(JSON.stringify({ success: true }), { status: 200 });
        }) as typeof fetch;

        const result = await relayAuthRequest('/api/v1/auth/login', {
            body: { email: 'a@b.c' },
            bearer: 'tok',
        });

        expect(result.status).toBe(200);
        expect(result.body).toEqual({ success: true });
        const sent = responses[0] as { url: string; headers: Record<string, string>; body: string };
        expect(sent.url).toContain('/api/v1/auth/login');
        expect(sent.headers.Authorization).toBe('Bearer tok');
        expect(JSON.parse(sent.body as string)).toEqual({ email: 'a@b.c' });
    });

    it('omits the body and Authorization entirely when not supplied', async () => {
        const seen: Array<{ headers: Record<string, string>; body?: unknown }> = [];
        global.fetch = vi.fn(async (_url, init) => {
            const headers = (init as RequestInit).headers as Record<string, string>;
            seen.push({ headers, body: (init as RequestInit).body });
            return new Response(null, { status: 204 }); // 204 is bodyless by spec
        }) as typeof fetch;

        await relayAuthRequest('/api/v1/auth/logout-all');

        expect(seen[0].headers['Content-Type']).toBe('application/json');
        expect(seen[0].headers.Authorization).toBeUndefined();
        expect(seen[0].body).toBeUndefined();
    });

    it('an explicit timeoutMs skips the 8 s default', async () => {
        global.fetch = vi.fn(async () => new Response(null, { status: 200 })) as typeof fetch;

        const result = await relayAuthRequest('/api/v1/auth/verify', { timeoutMs: 50 });
        expect(result.status).toBe(200);
    });

    it('surfaces non-JSON upstream bodies as a null body rather than throwing', async () => {
        global.fetch = vi.fn(async () => new Response('<html>exploded</html>', { status: 502 })) as typeof fetch;

        const result = await relayAuthRequest('/api/v1/auth/whatever');
        expect(result).toEqual({ status: 502, body: null });
    });

    it('a network failure propagates after the timer is cleared', async () => {
        global.fetch = vi.fn(async () => {
            throw new Error('ECONNREFUSED');
        }) as unknown as typeof fetch;

        await expect(relayAuthRequest('/api/v1/auth/login')).rejects.toThrow('ECONNREFUSED');
    });

    it('createAuthReference is an 8-char AUTH- token, unique per call', () => {
        const a = createAuthReference();
        const b = createAuthReference();

        expect(a).toMatch(/^AUTH-[0-9a-z]{8}$/);
        expect(a).not.toBe(b);
    });
});

describe('auth-relay.failure envelope', () => {
    it('4xx keeps the actionable code/message and NO reference', async () => {
        const res = relayFailure('forgot-password', 400, {
            error: { code: 'VALIDATION_ERROR', message: 'Email is not registered' },
        });
        const parsed = (await res.json()) as { success: boolean; error: Record<string, unknown> };

        expect(res.status).toBe(400);
        expect(parsed.success).toBe(false);
        expect(parsed.error).toEqual({
            code: 'VALIDATION_ERROR',
            message: 'Email is not registered',
        });
    });

    it('upstream field-level details ride along on 4xx envelopes', async () => {
        const res = relayFailure('login', 422, {
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Check the form',
                details: { fields: { email: 'Invalid email' } },
            },
        });
        const parsed = (await res.json()) as { success: boolean; error: { details?: unknown } };

        expect(parsed.error.details).toEqual({ fields: { email: 'Invalid email' } });
    });

    it('5xx attaches a reference, logs it and defaults the message when upstream gave none', async () => {
        const log = vi.spyOn(console, 'error').mockImplementation(() => {});
        const res = relayFailure('verify-email', 503, null);
        const parsed = (await res.json()) as { success: boolean; error: Record<string, unknown> };

        expect(res.status).toBe(503);
        expect(parsed.error.code).toBe('SERVER_ERROR');
        expect(parsed.error.message).toContain('try again');
        expect(String(parsed.error.reference)).toMatch(/^AUTH-/);
        expect(log).toHaveBeenCalledTimes(1);
        expect(String(log.mock.calls[0][0])).toContain('upstream 503');
    });

    it('5xx with an upstream error object preserves its message but still gets a reference', async () => {
        const res = relayFailure('reset-password', 502, {
            error: { code: 'UNAVAILABLE', message: 'maintenance' },
        });
        const parsed = (await res.json()) as { success: boolean; error: Record<string, unknown> };

        expect(parsed.error.message).toBe('maintenance');
        expect(parsed.error.reference).toBeDefined();
    });

    it('relayUnreachable is the 500 reference path', async () => {
        const res = relayUnreachable('change-password');
        expect(res.status).toBe(500);
        const parsed = (await res.json()) as { success: boolean; error: Record<string, unknown> };
        expect(parsed.error.reference).toMatch(/^AUTH-/);
    });
});

describe('auth-relay.cookie/refresh helpers', () => {
    it('reads set-cookie via getSetCookie when the runtime offers it', () => {
        const headers = new Headers({ 'set-cookie': 'a=1; Path=/' });
        expect(getSetCookieHeaders({ headers } as unknown as Response)).toEqual(['a=1; Path=/']);
    });

    it('falls back to the folded header on older runtimes', () => {
        const folded = new Headers({ 'set-cookie': 'a=1' });
        const fake = {
            headers: Object.defineProperties(folded, {}),
        } as unknown as Response;
        // no getSetCookie in this fake
        (fake.headers as { getSetCookie?: unknown }).getSetCookie = undefined;
        expect(getSetCookieHeaders(fake)).toEqual(['a=1']);
    });

    it('returns an empty array when the upstream set no cookie at all', () => {
        expect(getSetCookieHeaders(new Response(null, { status: 200 }))).toEqual([]);
    });

    it('extractRefreshToken prefers the body token', () => {
        expect(extractRefreshToken({ data: { refreshToken: 'tok-body' } }, ['refreshToken=cookie-tok; Path=/'])).toBe(
            'tok-body'
        );
    });

    it('extractRefreshToken falls back to the refresh cookie and URL-decodes it', () => {
        expect(extractRefreshToken(null, ['refreshToken=tok%20cookie; Path=/api/v1/auth'])).toBe('tok cookie');
        expect(extractRefreshToken({}, ['other=1'])).toBeUndefined();
        expect(extractRefreshToken(null, [])).toBeUndefined();
    });
});
