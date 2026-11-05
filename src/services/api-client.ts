import { config } from '@/config';
import { ApiError } from '@/lib/api-error';

/**
 * The browser HTTP client.
 *
 * T20: this used to be an axios instance. Axios is ~13 kB gzip of runtime on
 * every authenticated route for features this app does not use — interceptors
 * (only one), cancellation tokens (AbortSignal exists), transforms (JSON), and
 * a request adapter. The BFF speaks JSON over same-origin fetch, so the
 * transport is now `fetch` and the one interceptor that matters (401 →
 * single-flight refresh → retry once) is implemented directly.
 *
 * The public surface is intentionally the same shape the feature services
 * already call: `get/post/put/patch/delete` returning `{ data, status, headers }`.
 */

export interface ApiEnvelope<T> {
    success: boolean;
    data?: T;
    meta?: unknown;
    error?: { code: string; message: string; details?: unknown };
}

export interface ApiResponse<T> {
    data: T;
    status: number;
    headers: Headers;
}

export interface RequestOptions {
    params?: object;
    headers?: Record<string, string>;
    /** DELETE bodies are legal and the members endpoint uses one. */
    data?: unknown;
    signal?: AbortSignal;
}

const AUTH_ROUTE_PATTERN =
    /\/api\/auth\/(login|register|refresh|logout|logout-all|session|ws-token|forgot-password|reset-password|verify-email|resend-verification|change-password)$/;

/** Read at call time: the tests point the client at an absolute JSdom origin. */
const defaults = {
    baseURL: config.apiUrl as string,
    timeout: 30_000,
};

let refreshPromise: Promise<boolean> | null = null;

async function performRefresh(): Promise<boolean> {
    try {
        const res = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'same-origin',
        });
        return res.ok;
    } catch {
        return false;
    }
}

function refreshSession(): Promise<boolean> {
    if (!refreshPromise) {
        refreshPromise = performRefresh().finally(() => {
            refreshPromise = null;
        });
    }
    return refreshPromise;
}

function redirectToLogin(): void {
    if (typeof window === 'undefined') return;
    const current = window.location.pathname + window.location.search;
    window.location.href = `/login?from=${encodeURIComponent(current)}`;
}

function mapHttpStatus(status?: number): string {
    switch (status) {
        case 400: return 'BAD_REQUEST';
        case 401: return 'TOKEN_EXPIRED';
        case 403: return 'FORBIDDEN';
        case 404: return 'NOT_FOUND';
        case 429: return 'RATE_LIMITED';
        case 500: return 'SERVER_ERROR';
        default: return 'UNKNOWN_ERROR';
    }
}

function resolveUrl(path: string, params?: object): string {
    const absolute = /^https?:\/\//.test(path);
    const base = absolute ? path : `${defaults.baseURL}${path}`;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const url = new URL(base, origin);

    for (const [key, value] of Object.entries((params ?? {}) as Record<string, unknown>)) {
        if (value === undefined || value === null) continue;
        if (Array.isArray(value)) {
            for (const item of value) {
                if (item !== undefined && item !== null) url.searchParams.append(`${key}[]`, String(item));
            }
            continue;
        }
        if (typeof value === 'object') continue;
        url.searchParams.set(key, String(value));
    }

    return url.toString();
}

function timeoutSignal(caller?: AbortSignal): AbortSignal {
    const timeout = AbortSignal.timeout(defaults.timeout);
    if (!caller) return timeout;
    return typeof AbortSignal.any === 'function' ? AbortSignal.any([caller, timeout]) : caller;
}

async function parseBody(response: Response): Promise<unknown> {
    const text = await response.text().catch(() => '');
    if (!text) return undefined;
    try {
        return JSON.parse(text);
    } catch {
        // Gateway HTML/text bodies are not envelopes; the status still maps.
        return undefined;
    }
}

function envelopeError(body: unknown, status: number, fallback: string): ApiError {
    const envelope = body as ApiEnvelope<never> | undefined;
    return new ApiError({
        code: envelope?.error?.code || mapHttpStatus(status),
        message: envelope?.error?.message || fallback || 'Request failed',
        status,
        details: envelope?.error?.details,
    });
}

async function execute<T>(
    method: string,
    path: string,
    body?: unknown,
    options: RequestOptions = {},
    retried = false
): Promise<ApiResponse<T>> {
    let response: Response;
    try {
        response = await fetch(resolveUrl(path, options.params), {
            method,
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
                ...options.headers,
            },
            body: body === undefined ? undefined : JSON.stringify(body),
            signal: timeoutSignal(options.signal),
        });
    } catch (error) {
        // No response at all: offline, DNS, abort. Never wrap an ApiError twice.
        if (error instanceof ApiError) throw error;
        throw new ApiError({
            code: 'UNKNOWN_ERROR',
            message: error instanceof Error && error.message ? error.message : 'Request failed',
        });
    }

    if (response.ok) {
        return { data: (await parseBody(response)) as T, status: response.status, headers: response.headers };
    }

    const body_ = await parseBody(response);

    // 401 -> single-flight refresh -> retry once (FE-05).
    if (response.status === 401 && !AUTH_ROUTE_PATTERN.test(path) && !retried) {
        const refreshed = await refreshSession();
        if (refreshed) {
            return execute<T>(method, path, body, options, true);
        }
        if (typeof window !== 'undefined') {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => undefined);
            redirectToLogin();
        }
    }

    throw envelopeError(body_, response.status, response.statusText);
}

const apiClient = {
    defaults,
    get<T = unknown>(path: string, options?: RequestOptions) {
        return execute<T>('GET', path, undefined, options);
    },
    post<T = unknown>(path: string, body?: unknown, options?: RequestOptions) {
        return execute<T>('POST', path, body, options);
    },
    put<T = unknown>(path: string, body?: unknown, options?: RequestOptions) {
        return execute<T>('PUT', path, body, options);
    },
    patch<T = unknown>(path: string, body?: unknown, options?: RequestOptions) {
        return execute<T>('PATCH', path, body, options);
    },
    delete<T = unknown>(path: string, options?: RequestOptions) {
        return execute<T>('DELETE', path, options?.data, options);
    },
};

export default apiClient;
