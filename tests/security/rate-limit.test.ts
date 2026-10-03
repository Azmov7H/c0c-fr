import { describe, it, expect, afterEach, vi } from 'vitest';

import { checkAuthRateLimit, rateLimitHeaders } from '@/lib/rate-limit';

/**
 * T01 — BFF auth rate limiting.
 *
 * Scope note: this is per-instance defence in depth. The authoritative limit is
 * the backend's authRateLimiter, which runs against shared state (ADR-005). This
 * layer exists so load on the Next origin is absorbed cheaply.
 */

const makeRequest = (ip: string): Request =>
    new Request('https://app.test/api/auth/login', {
        headers: { 'x-forwarded-for': `${ip}, 10.0.0.1` },
    });

describe('BFF auth rate limit', () => {
    // process.env.NODE_ENV is readonly in the type; vi.stubEnv is the supported
    // way to vary it per-test.
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('allows attempts under the limit', () => {
        vi.stubEnv('NODE_ENV', 'production');
        for (let i = 0; i < 5; i += 1) {
            expect(checkAuthRateLimit(makeRequest(`10.0.0.${i}`)).limited).toBe(false);
        }
    });

    it('limits a single client that exceeds the ceiling', () => {
        vi.stubEnv('NODE_ENV', 'production');
        const ip = '203.0.113.7';

        let limited = false;
        for (let i = 0; i < 40; i += 1) {
            if (checkAuthRateLimit(makeRequest(ip)).limited) {
                limited = true;
                break;
            }
        }

        expect(limited).toBe(true);
    });

    it('tracks clients independently', () => {
        vi.stubEnv('NODE_ENV', 'production');

        const noisy = '198.51.100.1';
        for (let i = 0; i < 40; i += 1) checkAuthRateLimit(makeRequest(noisy));

        expect(checkAuthRateLimit(makeRequest(noisy)).limited).toBe(true);
        // A different client behind the same load balancer is unaffected.
        expect(checkAuthRateLimit(makeRequest('198.51.100.2')).limited).toBe(false);
    });

    it('uses the first forwarded hop, not the whole chain', () => {
        vi.stubEnv('NODE_ENV', 'production');

        const first = checkAuthRateLimit(makeRequest('192.0.2.1'));
        expect(first.remaining).toBeGreaterThan(0);

        // The same client with extra hops appended is still the same client.
        const withMoreHops = checkAuthRateLimit(
            new Request('https://app.test/api/auth/login', {
                headers: { 'x-forwarded-for': '192.0.2.1, 10.0.0.1, 10.0.0.2' },
            })
        );
        expect(withMoreHops.remaining).toBe(first.remaining - 1);
    });

    it('is disabled outside production', () => {
        vi.stubEnv('NODE_ENV', 'development');
        for (let i = 0; i < 100; i += 1) {
            expect(checkAuthRateLimit(makeRequest('203.0.113.99')).limited).toBe(false);
        }
    });

    it('emits Retry-After only when limited', () => {
        const allowed = rateLimitHeaders({ limited: false, remaining: 5, retryAfterSeconds: 0 });
        expect(allowed['Retry-After']).toBeUndefined();
        expect(allowed['X-RateLimit-Remaining']).toBe('5');

        const blocked = rateLimitHeaders({ limited: true, remaining: 0, retryAfterSeconds: 42 });
        expect(blocked['Retry-After']).toBe('42');
        expect(blocked['X-RateLimit-Remaining']).toBe('0');
    });
});