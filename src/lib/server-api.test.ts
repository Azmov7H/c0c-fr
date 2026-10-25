import { afterEach, describe, expect, it, vi } from 'vitest';

import { ServerApiError, serverGet, serverGetEnvelope } from './server-api';

/**
 * T18 — the RSC read path (T14 D4): browser reads go through the same-origin
 * `/api/v1` rewrite, but server components talk to the backend DIRECTLY with
 * the caller's cookie forwarded verbatim. Every per-user response must be
 * `cache: 'no-store'` — a shared server cache would leak user A's data into
 * user B's prefetched stream.
 */

const { cookieStore } = vi.hoisted(() => ({
    cookieStore: { toString: (): string => 'auth_session=token-1; refresh_token=r-1' },
}));

vi.mock('next/headers', () => ({
    cookies: vi.fn(async () => cookieStore),
}));

// Trailing slash is deliberate: the module must strip it before building URLs.
vi.mock('@/services/server-api', () => ({ SERVER_API_URL: 'http://backend.test:12345/' }));

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });

function stubFetch(handler: () => Promise<Response>) {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => handler());
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
}

describe('server-api (RSC reads → backend)', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('serverGet unwraps the {success,data} envelope and forwards the cookie with cache:no-store', async () => {
        const fetchMock = stubFetch(async () => json({ success: true, data: { title: 'p1' } }));

        const data = await serverGet<{ title: string }>('/projects/abc');

        expect(data).toEqual({ title: 'p1' });
        const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
        expect(url).toBe('http://backend.test:12345/api/v1/projects/abc');
        expect(init.cache).toBe('no-store');
        expect((init.headers as Record<string, string>).cookie).toBe(
            'auth_session=token-1; refresh_token=r-1'
        );
        expect((init.headers as Record<string, string>).accept).toBe('application/json');
    });

    it('serverGetEnvelope keeps the whole {success,data,meta} shape for paginated lists', async () => {
        const envelope = { success: true, data: [{ id: '1' }], meta: { total: 7 } };
        stubFetch(async () => json(envelope));

        await expect(serverGetEnvelope<unknown>('/projects')).resolves.toEqual(envelope);
    });

    it('buildQuery prunes null/undefined/object values and stringifies primitives; empty → no ?', async () => {
        const fetchMock = stubFetch(async () => json({ success: true, data: {} }));

        await serverGet('/x', { q: 'a', page: 2, done: true, skip: null, skip2: undefined, bad: { y: 1 } });
        const first = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
        expect(first[0].endsWith('/api/v1/x?q=a&page=2&done=true')).toBe(true);

        await serverGet('/y');
        const second = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
        expect(second[0].endsWith('/api/v1/y')).toBe(true); // no trailing '?'
    });

    it('no cookie in the request context → no cookie header (not an empty one)', async () => {
        cookieStore.toString = () => '';
        const fetchMock = stubFetch(async () => json({ success: true, data: 1 }));

        await serverGet('/me');
        const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
        expect(init.headers).toEqual({ accept: 'application/json' });
    });

    it('backend error envelope → ServerApiError carries the backend message, code and status', async () => {
        stubFetch(async () =>
            json({ success: false, error: { code: 'FORBIDDEN', message: 'Not allowed.' } }, 403)
        );

        const err = (await serverGet('/x').catch((e: unknown) => e)) as ServerApiError;
        expect(err).toBeInstanceOf(ServerApiError);
        expect(err.status).toBe(403);
        expect(err.code).toBe('FORBIDDEN');
        expect(err.message).toBe('Not allowed.');
    });

    it('params that prune to NOTHING produce no query string at all (not a lone ?)', async () => {
        const fetchMock = stubFetch(async () => json({ success: true, data: 1 }));

        await serverGet('/x', { skip: null, skip2: undefined, bad: { y: 1 } });
        const [url] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
        expect(url.endsWith('/api/v1/x')).toBe(true);
        expect(url).not.toContain('?');
    });

    it('backend error envelope WITHOUT a message keeps the status-based default message', async () => {
        stubFetch(async () => json({ success: false, error: { code: 'X_FALLBACK' } }, 500));

        const err = (await serverGet('/x').catch((e: unknown) => e)) as ServerApiError;
        expect(err.code).toBe('X_FALLBACK');
        expect(err.message).toBe('Request failed with status 500'); // body.error.message was absent
    });

    it('non-JSON error body (gateway HTML, proxy timeouts) keeps the status and a status-based message', async () => {
        stubFetch(async () => new Response('<html>502</html>', { status: 502 }));

        const err = (await serverGet('/x').catch((e: unknown) => e)) as ServerApiError;
        expect(err).toBeInstanceOf(ServerApiError);
        expect(err.status).toBe(502);
        expect(err.code).toBe('SERVER_API_ERROR'); // constructor default — backend gave no code
        expect(err.message).toBe('Request failed with status 502');
    });
});
