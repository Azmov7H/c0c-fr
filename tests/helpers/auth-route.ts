import { NextRequest } from 'next/server';
import { vi } from 'vitest';

export interface MockBackendResponse {
    status: number;
    body: unknown;
}

export function buildBackendMock() {
    return {
        /**
         * Install a fetch mock that returns a sequence of canned responses,
         * one per call. Unconsumed calls throw to surface missing stubs.
         */
        install: (responses: MockBackendResponse[]) => {
            const calls: Array<{ url: string; init?: RequestInit }> = [];
            let i = 0;
            const fetchMock = vi.fn(async (url: any, init?: RequestInit) => {
                calls.push({ url: String(url), init });
                if (i >= responses.length) {
                    throw new Error(
                        `No more mock responses registered (call #${i + 1} to ${String(url)})`
                    );
                }
                const r = responses[i++];
                return new Response(JSON.stringify(r.body), {
                    status: r.status,
                    headers: { 'Content-Type': 'application/json' },
                });
            });
            vi.stubGlobal('fetch', fetchMock);
            return {
                calls,
                remaining: () => responses.length - i,
            };
        },
    };
}

export function makeRequest(opts: {
    url?: string;
    method?: 'GET' | 'POST';
    cookies?: Record<string, string>;
    body?: unknown;
}): NextRequest {
    const cookieHeader = opts.cookies
        ? Object.entries(opts.cookies)
              .map(([k, v]) => `${k}=${v}`)
              .join('; ')
        : undefined;
    return new NextRequest(opts.url ?? 'http://localhost/api/auth', {
        method: opts.method ?? 'POST',
        headers: {
            ...(cookieHeader ? { Cookie: cookieHeader } : {}),
            'Content-Type': 'application/json',
        },
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
}

export function cookiesOf(res: Response): Array<{ name: string; value: string }> {
    // The real NextResponse exposes its cookies on `.cookies.getAll()`.
    const all = (res as any).cookies.getAll() as Array<{
        name: string;
        value: string;
    }>;
    return all;
}
