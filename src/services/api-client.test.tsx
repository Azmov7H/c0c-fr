// @vitest-environment jsdom
/**
 * T18 P0 — the 401 → single-flight refresh → retry interceptor.
 *
 * This is the subtlest code in the frontend: rotation invalidates sibling
 * tokens, so a naive interceptor that fires one refresh per 401 would log every
 * user out on every access-token expiry. These tests force exactly that storm —
 * ten concurrent 401s — and assert the storm collapses into one refresh.
 *
 * MSW intercepts at the network layer: the client is pointed at an absolute
 * baseURL (jsdom has no fetch resolution of relative URLs) and the
 * refresh/logout requests the module makes itself through global fetch flow
 * through the same interceptor, so every boundary a real browser sees is real
 * here.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../lib/api-error';
import { startMsw, server, http, HttpResponse } from '../../tests/msw/server';

startMsw();

const healthy = { success: true, data: { hello: 'world' } };

/** The response shape the feature services consume. */
type ClientResponse = { data: unknown; status: number };

/** jsdom + undici cannot resolve a relative fetch URL, so the client under
 *  test gets an absolute baseURL. Only affects the test environment — production
 *  keeps the app's same-origin `config.apiUrl` value.
 */
async function useApi() {
    const { default: apiClient } = await import('../services/api-client');
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
        // `.data` is the raw JSON body — which keeps the envelope shape
        // (api-client documents this explicitly). The 10 retries really succeed.
        const body = (fulfilled[0].value as ClientResponse).data;
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

        const res = await apiClient.get<{ data: { rows: number }; meta: { total: number } }>('/meta');
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
        expect(err.message).toBeTruthy(); // the transport message, never empty
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

describe('api-client method surface, params and signals', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('every verb reaches the wire with its body (and DELETE bodies are legal)', async () => {
        const seen: Record<string, { method: string; body: unknown; contentType: string | null }> = {};
        const capture = async (request: Request) => ({
            method: request.method,
            body: request.method === 'GET' ? null : await request.json(),
            contentType: request.headers.get('content-type'),
        });
        server.use(
            http.post('/api/v1/beings', async ({ request }) => {
                seen.POST = await capture(request);
                return HttpResponse.json(healthy);
            }),
            http.put('/api/v1/beings', async ({ request }) => {
                seen.PUT = await capture(request);
                return HttpResponse.json(healthy);
            }),
            http.patch('/api/v1/beings', async ({ request }) => {
                seen.PATCH = await capture(request);
                return HttpResponse.json(healthy);
            }),
            http.delete('/api/v1/beings', async ({ request }) => {
                seen.DELETE = await capture(request); // deletes may carry { data }
                return HttpResponse.json(healthy);
            })
        );

        const apiClient = await useApi();
        await apiClient.post('/beings', { name: 'a' });
        await apiClient.put('/beings', { name: 'b' });
        await apiClient.patch('/beings', { name: 'c' });
        await apiClient.delete('/beings', { data: { memberId: 'm-1' } });

        expect(seen.POST.method).toBe('POST');
        expect((seen.POST.body as { name?: string }).name).toBe('a');
        expect(seen.POST.contentType).toContain('application/json');
        expect(seen.PUT.method).toBe('PUT');
        expect((seen.PUT.body as { name?: string }).name).toBe('b');
        expect(seen.PATCH.method).toBe('PATCH');
        expect((seen.PATCH.body as { name?: string }).name).toBe('c');
        expect(seen.DELETE.method).toBe('DELETE');
        expect(seen.DELETE.body).toEqual({ memberId: 'm-1' });
    });

    it('a GET without a body carries no Content-Type at all', async () => {
        let contentType: string | null = 'unset';
        server.use(
            http.get('/api/v1/lean', ({ request }) => {
                contentType = request.headers.get('content-type');
                return HttpResponse.json(healthy);
            })
        );

        const apiClient = await useApi();
        await apiClient.get('/lean');

        expect(contentType).toBeNull();
    });

    it('params: scalars render, arrays become key[], null/undefined/objects are skipped', async () => {
        let url = '';
        server.use(
            http.get('/api/v1/query', ({ request }) => {
                url = request.url;
                return HttpResponse.json(healthy);
            })
        );

        const apiClient = await useApi();
        await apiClient.get('/query', {
            params: {
                page: 2,
                tags: ['a', 'b'],
                empty: null,
                missing: undefined,
                nested: { x: 1 },
            },
        });

        const parsed = new URL(url);
        expect(parsed.searchParams.get('page')).toBe('2');
        expect(parsed.searchParams.getAll('tags[]')).toEqual(['a', 'b']);
        expect(parsed.searchParams.get('empty')).toBeNull();
        expect(parsed.searchParams.has('missing')).toBe(false);
        expect(parsed.searchParams.has('nested')).toBe(false);
    });

    it('an aborted caller signal fails the request through the timeout-join path', async () => {
        server.use(
            http.get('/api/v1/slow', async () => {
                await new Promise((resolve) => setTimeout(resolve, 400));
                return HttpResponse.json(healthy);
            })
        );

        const apiClient = await useApi();
        const controller = new AbortController();
        controller.abort();

        const err = (await apiClient.get('/slow', { signal: controller.signal }).catch(
            (e: unknown) => e
        )) as { code?: string; status?: number };

        expect(err.code).toBe('UNKNOWN_ERROR'); // transport error, not a response
        expect(err.status).toBeUndefined();
    });

    it('an absolute URL is used verbatim (no baseURL prefix)', async () => {
        let url = '';
        server.use(
            http.get('/api/v1/checkout', ({ request }) => {
                url = request.url;
                return HttpResponse.json(healthy);
            })
        );

        const apiClient = await useApi();
        await apiClient.get('http://localhost:3000/api/v1/checkout');

        expect(new URL(url).pathname).toBe('/api/v1/checkout');
        expect(url.includes('/api/v1/api/v1')).toBe(false);
    });
});

describe('api-client defensive edges (SSR guards, transport oddities)', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('a 204 (or any bodyless ok) resolves with data undefined', async () => {
        server.use(http.delete('/api/v1/members/9', () => new HttpResponse(null, { status: 204 })));

        const apiClient = await useApi();
        const result = await apiClient.delete('/members/9');

        expect(result.status).toBe(204);
        expect(result.data).toBeUndefined();
    });

    it('array params skip null/undefined members but keep the rest as key[]', async () => {
        let url = '';
        server.use(
            http.get('/api/v1/pick', ({ request }) => {
                url = request.url;
                return HttpResponse.json(healthy);
            })
        );

        const apiClient = await useApi();
        await apiClient.get('/pick', { params: { tags: ['a', null, 'b', undefined] } });

        expect(new URL(url).searchParams.getAll('tags[]')).toEqual(['a', 'b']);
    });

    it('an empty statusText with a non-envelope body falls all the way to "Request failed"', async () => {
        const previous = global.fetch;
        // undici only fills statusText when a REASON PHRASE is present; locally
        // constructed responses (what an HTTP/2 origin produces in practice) carry
        // an empty one, which is the fallback arm under test.
        global.fetch = vi.fn(async () => new Response('nope', { status: 418 })) as unknown as typeof fetch;
        try {
            const apiClient = await useApi();
            const err = (await apiClient.get('/things').catch((e: unknown) => e)) as {
                code?: string;
                message?: string;
            };

            expect(err.code).toBe('UNKNOWN_ERROR'); // 418 hits mapHttpStatus's default arm
            expect(err.message).toBe('Request failed'); // no envelope, no statusText fallback
        } finally {
            global.fetch = previous;
        }
    });

    it('an ApiError escaping the transport is re-thrown, never double-wrapped', async () => {
        const previous = global.fetch;
        global.fetch = vi.fn(async () => {
            throw new ApiError({ code: 'NASTY', message: 'market crash' });
        }) as unknown as typeof fetch;
        try {
            const apiClient = await useApi();
            const err = (await apiClient.get('/things').catch((e: unknown) => e)) as { code?: string };

            expect(err).toBeInstanceOf(ApiError);
            expect(err.code).toBe('NASTY');
        } finally {
            global.fetch = previous;
        }
    });

    it('a transport rejection that is not an Error degrades to the UNKNOWN_ERROR fallback', async () => {
        const previous = global.fetch;
        global.fetch = vi.fn(async () => {
            throw 'socket glitch'; // pathological runtime, not an Error instance
        }) as unknown as typeof fetch;
        try {
            const apiClient = await useApi();
            const err = (await apiClient.get('/things').catch((e: unknown) => e)) as {
                code?: string;
                message?: string;
            };

            expect(err.code).toBe('UNKNOWN_ERROR');
            expect(err.message).toBe('Request failed');
        } finally {
            global.fetch = previous;
        }
    });

    it('a body-less/garbage-decode pathology resolves with data undefined', async () => {
        // A response whose stream was already consumed (gateway cache replay
        // pathology): text() rejects, parseBody degrades to undefined and the
        // caller still receives a well-formed (if empty) 200. The transport is
        // mocked directly rather than through MSW, because the exploit lives
        // in the undici Response itself.
        const previous = global.fetch;
        global.fetch = vi.fn(async () => {
            const ghost = new Response('{"cached": true}', { status: 200, headers: { 'content-type': 'application/json' } });
            await ghost.text(); // consume the stream before it ever reaches the client
            return ghost;
        }) as unknown as typeof fetch;
        try {
            const apiClient = await useApi();
            const result = await apiClient.get('/ghost');

            expect(result.status).toBe(200);
            expect(result.data).toBeUndefined();
        } finally {
            global.fetch = previous;
        }
    });

    it('without AbortSignal.any the caller signal is used directly (legacy runtimes)', async () => {
        const hadAny = (AbortSignal as { any?: unknown }).any;
        delete (AbortSignal as { any?: unknown }).any;

        try {
            server.use(
                http.get('/api/v1/slow-legacy', async () => {
                    await new Promise((resolve) => setTimeout(resolve, 400));
                    return HttpResponse.json(healthy);
                })
            );

            const apiClient = await useApi();
            const controller = new AbortController();
            controller.abort();

            const err = (await apiClient
                .get('/slow-legacy', { signal: controller.signal })
                .catch((e: unknown) => e)) as { code?: string };

            expect(err.code).toBe('UNKNOWN_ERROR'); // the raw caller abort still fails the request
        } finally {
            (AbortSignal as { any?: unknown }).any = hadAny;
        }
    });
});

describe('api-client SSR behaviour (window undefined)', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('on a failed refresh in SSR context it skips logout/redirect and still throws TOKEN_EXPIRED', async () => {
        const refresh = vi.fn(async () => HttpResponse.json({}, { status: 401 }));
        const logout = vi.fn(async () => HttpResponse.json({ success: true, data: {} }));
        server.use(
            http.get('/api/v1/edge', () => new HttpResponse('no token', { status: 401 })),
            http.post('/api/auth/refresh', refresh),
            http.post('/api/auth/logout', logout)
        );
        vi.stubGlobal('window', undefined);

        const apiClient = await useApi();
        const err = (await apiClient.get('/edge').catch((e: unknown) => e)) as { code?: string };

        // No browser to call the BFF or navigate on; the error still surfaces typed.
        expect(logout).not.toHaveBeenCalled();
        expect(err.code).toBe('TOKEN_EXPIRED');
    });

    it('a logout transport failure is swallowed—the sign-out redirect still proceeds', async () => {
        const refresh = vi.fn(async () => HttpResponse.json({}, { status: 401 }));
        server.use(
            http.get('/api/v1/edge', () => new HttpResponse('no token', { status: 401 })),
            http.post('/api/auth/refresh', refresh)
        );

        // Only the logout call dies at the transport level (downed BFF);
        // everything else keeps flowing through MSW's patched fetch.
        const mswFetch = global.fetch;
        const previous = global.fetch;
        global.fetch = vi.fn(async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
            const url = typeof input === 'string' ? input : String(input);
            if (url.includes('/api/auth/logout')) throw new TypeError('Failed to fetch');
            return mswFetch?.(input, init);
        }) as unknown as typeof fetch;

        try {
            const apiClient = await useApi();
            const err = (await apiClient.get('/edge').catch((e: unknown) => e)) as {
                code?: string;
                message?: string;
            };

            expect(err.code).toBe('TOKEN_EXPIRED');
        } finally {
            global.fetch = previous;
        }
    });

    it('if the window vanishes mid-refresh (logout resolves after unmount) the redirect short-circuits', async () => {
        const refresh = vi.fn(async () => HttpResponse.json({}, { status: 401 }));
        const logout = vi.fn(async () => {
            // The BFF logout resolves while the page is being torn down —
            // if window is gone by the time redirectToLogin runs, the guard
            // inside must return without touching location.
            vi.stubGlobal('window', undefined);
            return HttpResponse.json({ success: true, data: {} });
        });
        server.use(
            http.get('/api/v1/edge', () => new HttpResponse('no token', { status: 401 })),
            http.post('/api/auth/refresh', refresh),
            http.post('/api/auth/logout', logout)
        );

        const apiClient = await useApi();
        const err = (await apiClient.get('/edge').catch((e: unknown) => e)) as { code?: string };

        expect(logout).toHaveBeenCalledTimes(1);
        expect(err.code).toBe('TOKEN_EXPIRED');
    });
});
