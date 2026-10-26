import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { SignJWT } from 'jose';
import { NextRequest } from 'next/server';
import { proxy, sanitizeRedirectPath, config as proxyConfig } from './proxy';

/**
 * T09 proxy tests — the gate must verify, not merely sniff a cookie.
 * Tokens are signed for real (jose, HS256) against the same contract the
 * backend implements, so these tests fail if either side drifts.
 */

const SECRET = 'test-secret-that-is-at-least-32-chars-long!!';
const SESSION_COOKIE = 'auth_session'; // dev name; proxy must accept both

const originalSecret = process.env.JWT_SECRET;
const originalMode = process.env.AUTH_MIDDLEWARE_MODE;
const originalCsp = process.env.CSP_ENFORCE;

beforeAll(() => {
    process.env.JWT_SECRET = SECRET;
});

afterAll(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
    if (originalMode === undefined) delete process.env.AUTH_MIDDLEWARE_MODE;
    else process.env.AUTH_MIDDLEWARE_MODE = originalMode;
    if (originalCsp === undefined) delete process.env.CSP_ENFORCE;
    else process.env.CSP_ENFORCE = originalCsp;
});

async function signToken(
    overrides: { typ?: string; aud?: string; exp?: number; secret?: string; tamperPayload?: boolean } = {}
): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const token = await new SignJWT({
        id: 'u1',
        email: 'a@b.c',
        role: 'user',
        ver: 1,
        typ: overrides.typ ?? 'access',
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuer('c0c-bake')
        .setAudience(overrides.aud ?? 'c0c-api')
        .setIssuedAt(now)
        .setExpirationTime(overrides.exp ?? now + 900)
        .sign(new TextEncoder().encode(overrides.secret ?? SECRET));

    if (overrides.tamperPayload) {
        // Flip one character in the payload segment; signature no longer matches.
        const [header, payload, sig] = token.split('.');
        const flipped = payload[0] === 'A' ? 'B' : 'A';
        return `${header}.${flipped}${payload.slice(1)}.${sig}`;
    }
    return token;
}

function makeRequest(
    path: string,
    opts: { cookies?: Record<string, string>; search?: string } = {}
): NextRequest {
    const headers: Record<string, string> = {};
    if (opts.cookies) {
        headers['Cookie'] = Object.entries(opts.cookies)
            .map(([k, v]) => `${k}=${v}`)
            .join('; ');
    }
    return new NextRequest(`http://localhost${path}${opts.search ?? ''}`, {
        method: 'GET',
        headers,
    });
}

function locationOf(res: Response): string {
    return res.headers.get('location') ?? '';
}

describe('proxy session verification (AC: verify, do not merely check)', () => {
    it('missing cookie on a protected route → redirects to /login with callbackUrl', async () => {
        const res = await proxy(makeRequest('/dashboard/projects'));
        expect(res.status).toBe(307);
        const loc = locationOf(res);
        expect(loc).toContain('/login');
        expect(loc).toContain('callbackUrl=%2Fdashboard%2Fprojects');
    });

    it('T13: /onboarding is protected for a signed-out visitor', async () => {
        const res = await proxy(makeRequest('/onboarding'));
        expect(res.status).toBe(307);
        const loc = locationOf(res);
        expect(loc).toContain('/login');
        expect(loc).toContain('callbackUrl=%2Fonboarding');
    });

    it('valid token → request passes through', async () => {
        const res = await proxy(
            makeRequest('/dashboard', { cookies: { [SESSION_COOKIE]: await signToken() } })
        );
        expect(res.status).toBe(200);
        expect(res.headers.get('x-proxy-next')).toBe('1');
    });

    it('expired token → redirected AND the dead cookie is cleared', async () => {
        const now = Math.floor(Date.now() / 1000);
        const res = await proxy(
            makeRequest('/dashboard', {
                cookies: { [SESSION_COOKIE]: await signToken({ exp: now - 60 }) },
            })
        );
        expect(res.status).toBe(307);
        expect(locationOf(res)).toContain('/login');
        const setCookie = res.headers.get('set-cookie') ?? '';
        expect(setCookie).toContain(`${SESSION_COOKIE}=`);
        expect(setCookie.toLowerCase()).toContain('max-age=0');
    });

    it('tampered payload → rejected (the presence-only check would have allowed it)', async () => {
        const res = await proxy(
            makeRequest('/dashboard', {
                cookies: { [SESSION_COOKIE]: await signToken({ tamperPayload: true }) },
            })
        );
        expect(res.status).toBe(307);
        expect(locationOf(res)).toContain('/login');
    });

    it('garbage value in the cookie → rejected', async () => {
        const res = await proxy(
            makeRequest('/dashboard', { cookies: { [SESSION_COOKIE]: 'not-a-jwt' } })
        );
        expect(res.status).toBe(307);
    });

    it('token signed with the wrong secret → rejected', async () => {
        const res = await proxy(
            makeRequest('/dashboard', {
                cookies: { [SESSION_COOKIE]: await signToken({ secret: 'a'.repeat(40) }) },
            })
        );
        expect(res.status).toBe(307);
    });

    it('a refresh-audience token is not a session token → rejected', async () => {
        const res = await proxy(
            makeRequest('/dashboard', {
                cookies: {
                    [SESSION_COOKIE]: await signToken({ typ: 'refresh', aud: 'c0c-refresh' }),
                },
            })
        );
        expect(res.status).toBe(307);
    });

    it('fails CLOSED when verification cannot run (secret missing)', async () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        delete process.env.JWT_SECRET;
        try {
            const res = await proxy(
                makeRequest('/dashboard', { cookies: { [SESSION_COOKIE]: await signToken() } })
            );
            expect(res.status).toBe(307);
            expect(locationOf(res)).toContain('/login');
            expect(errorSpy).toHaveBeenCalled();
        } finally {
            process.env.JWT_SECRET = SECRET;
            errorSpy.mockRestore();
        }
    });

    it('valid token visiting /login → redirected to /dashboard', async () => {
        const res = await proxy(
            makeRequest('/login', { cookies: { [SESSION_COOKIE]: await signToken() } })
        );
        expect(res.status).toBe(307);
        expect(locationOf(res)).toContain('/dashboard');
    });
});

describe('open-redirect guard on callbackUrl (no test existed before T09)', () => {
    const evilTargets = ['https://evil.com', 'http://evil.com', '//evil.com', '/\\evil.com', 'javascript:alert(1)'];

    it.each(evilTargets)('callbackUrl=%s → falls back to /dashboard', async (evil) => {
        const res = await proxy(
            makeRequest('/login', {
                cookies: { [SESSION_COOKIE]: await signToken() },
                search: `?callbackUrl=${encodeURIComponent(evil)}`,
            })
        );
        expect(res.status).toBe(307);
        const loc = locationOf(res);
        expect(new URL(loc).origin).toBe('http://localhost');
        expect(new URL(loc).pathname).toBe('/dashboard');
    });

    it('safe relative callbackUrl is honoured', async () => {
        const res = await proxy(
            makeRequest('/login', {
                cookies: { [SESSION_COOKIE]: await signToken() },
                search: '?callbackUrl=%2Fprojects%2F42%3Ftab%3Daudio',
            })
        );
        expect(res.status).toBe(307);
        expect(new URL(locationOf(res)).pathname).toBe('/projects/42');
    });

    it('sanitizeRedirectPath unit contract', () => {
        expect(sanitizeRedirectPath('/projects')).toBe('/projects');
        expect(sanitizeRedirectPath('/')).toBe('/');
        expect(sanitizeRedirectPath(null)).toBe('/dashboard');
        expect(sanitizeRedirectPath('//evil.com')).toBe('/dashboard');
        expect(sanitizeRedirectPath('/\\evil.com')).toBe('/dashboard');
        expect(sanitizeRedirectPath('https://evil.com')).toBe('/dashboard');
    });
});

describe('rollout modes (AUTH_MIDDLEWARE_MODE)', () => {
    it('presence mode: any cookie value passes (pre-T09 rollback path)', async () => {
        process.env.AUTH_MIDDLEWARE_MODE = 'presence';
        try {
            const res = await proxy(
                makeRequest('/dashboard', { cookies: { [SESSION_COOKIE]: 'x' } })
            );
            expect(res.status).toBe(200);
        } finally {
            delete process.env.AUTH_MIDDLEWARE_MODE;
        }
    });

    it('off mode: no gate at all (last resort)', async () => {
        process.env.AUTH_MIDDLEWARE_MODE = 'off';
        try {
            const res = await proxy(makeRequest('/dashboard'));
            expect(res.status).toBe(200);
        } finally {
            delete process.env.AUTH_MIDDLEWARE_MODE;
        }
    });
});

describe('CSP header delivery', () => {
    it('ships report-only by default with a nonce and no unsafe-inline for scripts', async () => {
        const res = await proxy(makeRequest('/'));
        const csp = res.headers.get('content-security-policy-report-only') ?? '';
        expect(csp).not.toBe('');
        expect(res.headers.get('content-security-policy')).toBeNull();
        expect(csp).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic' https:/);
        expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
        expect(csp).toContain("style-src 'self' 'unsafe-inline'");
        expect(csp).toContain("frame-ancestors 'none'");
        expect(csp).toContain("object-src 'none'");
    });

    it('CSP_ENFORCE=true flips to the enforcing header (config change, not a rebuild)', async () => {
        process.env.CSP_ENFORCE = 'true';
        try {
            const res = await proxy(makeRequest('/'));
            expect(res.headers.get('content-security-policy')).not.toBeNull();
            expect(res.headers.get('content-security-policy-report-only')).toBeNull();
        } finally {
            delete process.env.CSP_ENFORCE;
        }
    });

    it('a nonce is generated per request (two requests never share one)', async () => {
        const a = (await proxy(makeRequest('/'))).headers.get(
            'content-security-policy-report-only'
        );
        const b = (await proxy(makeRequest('/'))).headers.get(
            'content-security-policy-report-only'
        );
        const nonceOf = (csp: string | null) => csp?.match(/'nonce-([^']+)'/)?.[1];
        expect(nonceOf(a)).toBeTruthy();
        expect(nonceOf(a)).not.toBe(nonceOf(b));
    });
});

describe('matcher is narrowed (R-14)', () => {
    const matcher = new RegExp(`^${proxyConfig.matcher[0]}$`);

    it.each([
        ['/dashboard', true],
        ['/projects/new', true],
        ['/login', true],
        ['/', true],
        ['/api/auth/session', false],
        ['/api/v1/trends', false],
        ['/_next/static/chunk.js', false],
        ['/_next/image', false],
        ['/favicon.ico', false],
        ['/logo.png', false],
        ['/fonts/inter.woff2', false],
        ['/sitemap.xml', false],
        ['/manifest.webmanifest', false],
        ['/sw.js', false],
        ['/placeholder.png', false],
    ])('%s → matched: %s', (path, expected) => {
        expect(matcher.test(path)).toBe(expected);
    });
});
