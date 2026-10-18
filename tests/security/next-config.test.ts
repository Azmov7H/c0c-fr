import { describe, it, expect } from 'vitest';
import nextConfig from '../../next.config';

/**
 * T09 static-layer assertions.
 *
 * The eight security headers come from two places by design:
 *   - seven static headers from next.config.ts `headers()` (this file),
 *   - the CSP from src/middleware.ts (per-request nonce; see middleware.test.ts).
 * A test that asserted all eight in one place would lie about where the CSP is
 * produced; together these two files pin the full set.
 */

async function resolveHeaders(): Promise<Array<{ key: string; value: string }>> {
    const groups = await nextConfig.headers!();
    expect(groups).toHaveLength(1);
    expect(groups[0].source).toBe('/:path*');
    return groups[0].headers as Array<{ key: string; value: string }>;
}

describe('security headers (AC1 / R-12)', () => {
    it('sets the seven static headers with exact values on every path', async () => {
        const headers = await resolveHeaders();
        const byKey = Object.fromEntries(headers.map((h) => [h.key, h.value]));

        expect(byKey['X-Content-Type-Options']).toBe('nosniff');
        expect(byKey['X-Frame-Options']).toBe('DENY');
        expect(byKey['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
        expect(byKey['Permissions-Policy']).toBe(
            'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
        );
        expect(byKey['Cross-Origin-Opener-Policy']).toBe('same-origin');
        expect(byKey['X-DNS-Prefetch-Control']).toBe('on');
        expect(byKey['Strict-Transport-Security']).toBe(
            'max-age=63072000; includeSubDomains'
        );
    });

    it('HSTS does NOT include preload until the domain is confirmed eligible', async () => {
        const headers = await resolveHeaders();
        const hsts = headers.find((h) => h.key === 'Strict-Transport-Security');
        expect(hsts?.value).not.toContain('preload');
        // The reason is documented in next.config.ts, not just in a PR comment.
    });

    it('does not advertise the framework', () => {
        expect(nextConfig.poweredByHeader).toBe(false);
    });
});

describe('image host allowlist (AC: no wildcard, no http, unlisted hosts never fetched)', () => {
    it('allows no remote hosts at all — every rendered asset is same-origin today', () => {
        expect(nextConfig.images?.remotePatterns).toEqual([]);
    });

    it('the serialised config contains no wildcard host and no http:', () => {
        const serialised = JSON.stringify(nextConfig.images ?? {});
        expect(serialised).not.toContain('"**"');
        expect(serialised).not.toContain('http:');
    });

    it('forces attachment disposition for optimised images', () => {
        expect(nextConfig.images?.contentDispositionType).toBe('attachment');
    });
});
