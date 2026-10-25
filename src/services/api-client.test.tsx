// @vitest-environment jsdom
/**
 * T18 P0 — the 401 → single-flight refresh → retry interceptor.
 *
 * This is the subtlest code in the frontend: rotation invalidates sibling
 * tokens, so a naive interceptor that fires one refresh per 401 would log every
 * user out on every access-token expiry. These tests force exactly that storm —
 * ten concurrent 401s — and assert the storm collapses into one refresh.
 *
 * MSW intercepts at the network layer: axios is pinned to the `fetch` adapter
 * with an absolute baseURL (jsdom has no fetch resolution of relative URLs) and
 * the refresh/logout requests the module makes itself through global fetch flow
 * through the same interceptor, so every boundary a real browser sees is real
 * here.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { startMsw, server, http, HttpResponse } from '../../tests/msw/server';

startMsw();

const healthy = { success: true, data: { hello: 'world' } };

/** Minimal axios-response shape; avoids importing axios types into this test module. */
type AxiosLike = { data: unknown; status: number; config?: unknown };

/** jsdom + undici cannot resolve a relative fetch URL, so the axios instance
 *  under test gets an absolute baseURL. Only affects the test environment —
 *  production keeps the app's `config.apiUrl` value.
 */
async function useApi() {
    const { default: apiClient } = await import('../services/api-client');
    apiClient.defaults.adapter = 'fetch';
    apiClient.defaults.baseURL = 'http://localhost:3000/api/v1';
    return apiClient;
}

describe('api-client 401 interceptor', () => {
    it('silent-refreshes once for a storm of concurrent 401s and retries all of them', async () => {
        const refresh = vi.fn(async () =>
            HttpResponse.json({ success: true, data: { accessToken: 'a2' } })
        );

        const getCalls = { n: 0 };
        // The refresh handler is parked until all 10 initial requests have had
        // their 401 processed — that is the only scheduling that can prove the
        // flight was shared rather than ten refreshes racing.
        let release: (() => void) | null = null;
        const parked = new Promise<void>((resolve) => {
            release = resolve;
        });

        server.use(
            http.get('/api/v1/things', async () => {
                getCalls.n += 1;
                if (getCalls.n <= 10) {
                    if (getCalls.n === 10) {
                        release?.();
                    }
                    return HttpResponse.json(
                        {
                            success: false,
                            error: { code: 'TOKEN_EXPIRED', message: 'Access token expired.' },
                        },
                        { status: 401 }
                    );
                }
                return HttpResponse.json(healthy);
            }),
            http.post('/api/auth/refresh', async () => {
                await parked;
                return refresh();
            })
        );

        const apiClient = await useApi();
        const results = await Promise.allSettled(
            Array.from({ length: 10 }, () => apiClient.get('/things'))
        );

        expect(refresh).toHaveBeenCalledTimes(1);
        expect(getCalls.n).toBe(20); // 10 x 401 + 10 x retry
        const fulfilled = results.filter((entry) => entry.status === 'fulfilled') as Array<
            Extract<(typeof results)[number], { status: 'fulfilled' }>
        >;
        expect(fulfilled).toHaveLength(10);
        // axios's `.data` is the raw JSON body — which keeps the envelope shape
        // (api-client documents this explicitly). The 10 retries really succeed.
        const body = (fulfilled[0].value as AxiosLike).data;
        expect(body).toEqual(healthy);
    });

    it('never retries twice (_retried stops the loop) and never double-refreshes', async () => {
        const refresh = vi.fn(async () => {
            await new Promise((r) => setTimeout(r, 60));
            return HttpResponse.json({ success: true, data: { accessToken: 'a2' } });
        });
        const getCalls = { n: 0 };

        server.use(
            http.get('/api/v1/things', () => {
                getCalls.n += 1;
                return HttpResponse.json(
                    { success: false, error: { code: 'UNAUTHORIZED', message: 'expired' } },
                    { status: 401 }
                );
            }),
            http.post('/api/auth/refresh', refresh)
        );

        const apiClient = await useApi();
        const results = await Promise.allSettled(
            Array.from({ length: 4 }, () => apiClient.get('/things'))
        );

        // Exactly one refresh across all four flights; every retry hit 401 once
        // more and was then refused because _retried was already set.
        expect(refresh).toHaveBeenCalledTimes(1);
        expect(getCalls.n).toBe(8);
        const rejected = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
        expect(rejected).toHaveLength(4);
        for (const flight of rejected) {
            const err = flight.reason as { code?: string; status?: number };
            expect(err.code).toBe('UNAUTHORIZED');
            expect(err.status).toBe(401);
        }
    });

    it('a failed refresh logs the user out (BFF logout called) and surfaces TOKEN_EXPIRED', async () => {
        const refresh = vi.fn(async () => HttpResponse.json({}, { status: 401 }));
        const logout = vi.fn(async () => HttpResponse.json({ success: true, data: {} }));

        server.use(
            http.get('/api/v1/things', () =>
                HttpResponse.json(
                    { success: false, error: { code: 'TOKEN_EXPIRED', message: 'expired' } },
                    { status: 401 }
                )
            ),
            http.post('/api/auth/refresh', refresh),
            http.post('/api/auth/logout', logout)
        );

        const apiClient = await useApi();

        const err = await apiClient.get('/things').catch((e: unknown) => e);

        // The logout BFF call fired (the browser's auth cookies are cleared by
        // the same request the interceptor relies on); the login navigation
        // itself is a single location.href assignment — jsdom forbids asserting
        // on [Unforgeable] location, so the logout call is the observable half.
        expect(logout).toHaveBeenCalledTimes(1);
        expect((err as { code?: string }).code).toBe('TOKEN_EXPIRED');
        expect((err as { status?: number }).status).toBe(401);
        expect(err).toBeInstanceOf(Error);
    });

    it('auth routes bypass the refresh path entirely (AUTH_ROUTE_PATTERN guard)', async () => {
        const refresh = vi.fn(async () => HttpResponse.json({ success: true, data: {} }));

        server.use(
            http.get('/api/auth/session', () =>
                HttpResponse.json(
                    { success: false, error: { code: 'UNAUTHORIZED', message: 'no session' } },
                    { status: 401 }
                )
            ),
            http.post('/api/auth/refresh', refresh)
        );

        const apiClient = await useApi();

        const err = await apiClient.get('http://localhost:3000/api/auth/session').catch(
            (e: unknown) => e
        );

        expect(refresh).not.toHaveBeenCalled();
        expect((err as { code?: string }).code).toBe('UNAUTHORIZED');
        expect((err as { status?: number }).status).toBe(401);
    });

    it('maps the backend envelope onto ApiError (code, message, status, details)', async () => {
        server.use(
            http.get('/api/v1/blocked', () =>
                HttpResponse.json(
                    {
                        success: false,
                        error: {
                            code: 'FORBIDDEN',
                            message: 'Not allowed.',
                            details: { missing: 'manage' },
                        },
                    },
                    { status: 403 }
                )
            ),
            http.get('/api/v1/limited', () =>
                HttpResponse.json(
                    { success: false, error: { code: 'QUOTA_EXCEEDED', message: 'Slow down.' } },
                    { status: 429 }
                )
            )
        );

        const apiClient = await useApi();

        const bad = await apiClient.get('/blocked').catch((e: unknown) => e);
        expect((bad as { code?: string }).code).toBe('FORBIDDEN');
        expect((bad as { message?: string }).message).toBe('Not allowed.');
        expect((bad as { details?: unknown }).details).toEqual({ missing: 'manage' });

        const limited = await apiClient.get('/limited').catch((e: unknown) => e);
        expect((limited as { code?: string }).code).toBe('QUOTA_EXCEEDED');
        expect((limited as { status?: number }).status).toBe(429);
    });

    it('success responses keep the envelope the feature services read', async () => {
        server.use(
            http.get('/api/v1/meta', () =>
                HttpResponse.json({ success: true, data: { rows: 3 }, meta: { total: 7 } })
            )
        );

        const apiClient = await useApi();

        const res = await apiClient.get('/meta');
        expect(res.data.data).toEqual({ rows: 3 });
        expect(res.data.meta).toEqual({ total: 7 });
        expect(res.status).toBe(200);
    });
});

describe('api-client error mapping without a backend envelope', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    /** Gateway-style bodies (HTML/text/empty) carry no {error:{code}} — the
     *  interceptor must still yield a TYPED, status-mapped ApiError. */
    const cases: Array<[string, number, string]> = [
        ['/plain-400', 400, 'BAD_REQUEST'],
        ['/plain-403', 403, 'FORBIDDEN'],
        ['/plain-404', 404, 'NOT_FOUND'],
        ['/plain-429', 429, 'RATE_LIMITED'],
        ['/plain-500', 500, 'SERVER_ERROR'],
    ];

    it('maps every body-less error status without touching the refresh path', async () => {
        server.use(
            ...cases.map(([path, status]) =>
                http.get(`/api/v1${path}`, () => new HttpResponse('gateway', { status }))
            )
        );

        const apiClient = await useApi();

        for (const [path, status, code] of cases) {
            const err = (await apiClient.get(path).catch((e: unknown) => e)) as {
                code?: string;
                status?: number;
            };
            expect(err.code, `HTTP ${status} → ${code}`).toBe(code);
            expect(err.status).toBe(status);
        }
    });

    it('a network-level failure (no response at all) surfaces UNKNOWN_ERROR', async () => {
        server.use(http.get('/api/v1/netfail', () => HttpResponse.error()));

        const apiClient = await useApi();

        const err = (await apiClient.get('/netfail').catch((e: unknown) => e)) as {
            code?: string;
            status?: number;
            message?: string;
        };
        expect(err.code).toBe('UNKNOWN_ERROR');
        expect(err.status).toBeUndefined();
        expect(err.message).toBeTruthy(); // axios's own transport message, never empty
    });

    it('a refresh whose fetch itself throws → the network catch fails the refresh, logout still runs', async () => {
        const logout = vi.fn(async () => HttpResponse.json({ success: true, data: {} }));
        server.use(
            http.get('/api/v1/things', () =>
                HttpResponse.json(
                    { success: false, error: { code: 'TOKEN_EXPIRED', message: 'expired' } },
                    { status: 401 }
                )
            ),
            http.post('/api/auth/logout', logout)
        );

        // Refresh endpoint unreachable (offline/proxy): the transport throws
        // instead of answering 401. Everything else must flow through normally.
        const realFetch = globalThis.fetch;
        const fetchSpy = vi
            .spyOn(globalThis, 'fetch')
            .mockImplementation((async (input: RequestInfo | URL, init?: RequestInit) => {
                if (String(input).includes('/api/auth/refresh')) {
                    throw new Error('offline');
                }
                return realFetch(input, init);
            }) as typeof globalThis.fetch);

        const apiClient = await useApi();

        const err = (await apiClient.get('/things').catch((e: unknown) => e)) as {
            code?: string;
            status?: number;
        };

        expect(err.code).toBe('TOKEN_EXPIRED');
        expect(err.status).toBe(401);
        expect(logout).toHaveBeenCalledTimes(1); // forced sign-out on failed refresh
        expect(
            fetchSpy.mock.calls.some(([input]) => String(input).includes('/api/auth/refresh'))
        ).toBe(true);
    });

    it('a status v8 never sees in normal app flow (502) maps through the default arm', async () => {
        server.use(http.get('/api/v1/plain-502', () => new HttpResponse('bad gateway', { status: 502 })));

        const apiClient = await useApi();

        const err = (await apiClient.get('/plain-502').catch((e: unknown) => e)) as {
            code?: string;
            status?: number;
        };
        expect(err.code).toBe('UNKNOWN_ERROR'); // unrecognised status → default arm
        expect(err.status).toBe(502);
    });

    it('an AUTH-route 401 with no enveloped error still types as TOKEN_EXPIRED (no refresh attempt)', async () => {
        const refresh = vi.fn(async () => HttpResponse.json({ success: true, data: {} }));
        server.use(
            http.get('/api/auth/session', () => new HttpResponse('unauthenticated', { status: 401 })),
            http.post('/api/auth/refresh', refresh)
        );

        const apiClient = await useApi();

        const err = (await apiClient
            .get('http://localhost:3000/api/auth/session')
            .catch((e: unknown) => e)) as { code?: string; status?: number };
        expect(refresh).not.toHaveBeenCalled();
        expect(err.code).toBe('TOKEN_EXPIRED'); // the switch's 401 arm, reached envelope-less
        expect(err.status).toBe(401);
    });
});
