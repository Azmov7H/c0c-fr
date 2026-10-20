import 'server-only';
import { cookies } from 'next/headers';

import { SERVER_API_URL } from '@/services/server-api';

/**
 * Server-side read path for RSC prefetch (T14, decision D4).
 *
 * The browser uses `apiClient` against the same-origin `/api/v1` rewrite. A
 * server component cannot: axios has no origin to resolve a relative URL
 * against, and Next's rewrites apply to incoming requests, not outbound ones.
 * So this helper talks to the backend directly with `API_URL` and forwards the
 * caller's session cookie verbatim — the backend remains the authority.
 *
 * Reads only. Mutations stay on the client so they keep the single-flight
 * refresh/retry interceptor in api-client.ts; a server component has no safe
 * place to retry a write after the response has started.
 */

const API_URL = SERVER_API_URL.replace(/\/+$/, '');

export class ServerApiError extends Error {
    constructor(
        message: string,
        readonly status: number,
        readonly code = 'SERVER_API_ERROR'
    ) {
        super(message);
        this.name = 'ServerApiError';
    }
}

function buildQuery(params?: object): string {
    if (!params) return '';
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
            continue;
        }
        search.set(key, String(value));
    }
    const serialised = search.toString();
    return serialised ? `?${serialised}` : '';
}

async function serverRequest<T>(path: string, params?: object): Promise<T> {
    const cookieStore = await cookies();
    const url = `${API_URL}/api/v1${path}${buildQuery(params)}`;

    const response = await fetch(url, {
        headers: {
            accept: 'application/json',
            ...(cookieStore.toString() ? { cookie: cookieStore.toString() } : {}),
        },
        // Per-user data must never be cached in a shared server cache.
        cache: 'no-store',
    });

    if (!response.ok) {
        let message = `Request failed with status ${response.status}`;
        let code: string | undefined;
        try {
            const body = (await response.json()) as {
                error?: { message?: string; code?: string };
            };
            message = body.error?.message ?? message;
            code = body.error?.code;
        } catch {
            // Non-JSON error body (proxy timeout, gateway HTML). Keep the status.
        }
        throw new ServerApiError(message, response.status, code);
    }

    return (await response.json()) as T;
}

/** Envelope-unwrapped read, matching the feature services' `response.data.data`. */
export async function serverGet<T>(path: string, params?: object): Promise<T> {
    const body = await serverRequest<{ data: T }>(path, params);
    return body.data;
}

/**
 * Full-envelope read. Paginated list endpoints return `{success, data, meta}`,
 * and the client's `projectsService.getAll` hands that whole object to React
 * Query — so the prefetch must cache the same shape under the same key.
 */
export async function serverGetEnvelope<T>(path: string, params?: object): Promise<T> {
    return serverRequest<T>(path, params);
}
