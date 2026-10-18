import { NextResponse } from 'next/server';

import { SERVER_API_URL } from '@/services/server-api';

/**
 * Shared relay for the T12 auth BFF routes (change/forgot/reset/verify/
 * logout-all/resend). Keeps the failure envelope identical across routes:
 *
 *   { success: false, error: { code, message, details?, reference? } }
 *
 * `reference` is attached only when the failure is not the user's to fix
 * (upstream 5xx / network). 4xx errors carry actionable human messages and no
 * reference — printing "Reference: …" on a wrong password is noise. The
 * reference is also written to the server log next to the upstream status so
 * support can trace it without a request-id header the backend does not send.
 */

export interface RelayErrorShape {
    code?: string;
    message?: string;
    details?: unknown;
}

export interface RelayResult {
    status: number;
    body: unknown;
}

export function createAuthReference(): string {
    return `AUTH-${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`;
}

export async function relayAuthRequest(
    path: string,
    options: { body?: unknown; bearer?: string; timeoutMs?: number } = {}
): Promise<RelayResult> {
    const { body, bearer, timeoutMs = 8000 } = options;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(`${SERVER_API_URL}${path}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
            },
            ...(body === undefined ? {} : { body: JSON.stringify(body) }),
            signal: controller.signal,
        });

        const parsed = await response.json().catch(() => null);
        return { status: response.status, body: parsed };
    } finally {
        clearTimeout(timer);
    }
}

export function relayFailure(route: string, status: number, upstream: unknown): NextResponse {
    const upstreamError = (upstream as { error?: RelayErrorShape } | null)?.error;
    const code = upstreamError?.code || 'SERVER_ERROR';
    const message = upstreamError?.message || 'Something went wrong. Please try again.';
    const details = upstreamError?.details;

    const isServerFailure = status >= 500;
    const reference = isServerFailure ? createAuthReference() : undefined;
    if (reference) {
        console.error(`[bff:${route}] upstream ${status} code=${code} reference=${reference}`);
    }

    return NextResponse.json(
        {
            success: false,
            error: {
                code,
                message,
                ...(details === undefined ? {} : { details }),
                ...(reference ? { reference } : {}),
            },
        },
        { status }
    );
}

/** Network failure / timeout / abort — always the support-reference path. */
export function relayUnreachable(route: string): NextResponse {
    return relayFailure(route, 500, null);
}

/**
 * All Set-Cookie values of a fetch response. `getSetCookie()` is the standard
 * way to read them; older runtimes only expose the folded single header.
 */
export function getSetCookieHeaders(response: Response): string[] {
    const headers = response.headers as Headers & { getSetCookie?: () => string[] };
    if (typeof headers.getSetCookie === 'function') return headers.getSetCookie();
    const folded = response.headers.get('set-cookie');
    return folded ? [folded] : [];
}

/**
 * Refresh token for the BFF-owned cookie (T12, fixes a T02/T09 mismatch).
 *
 * T02 moved the refresh token out of every auth JSON body and into a
 * backend-scoped httpOnly cookie (`Path=/api/v1/auth`). The browser never
 * talks to the backend, so the BFF must promote that cookie to its own
 * `__Host-`/`refresh_token` cookie — otherwise session renewal silently dies
 * when the access token expires. The body is still checked first for
 * compatibility with the contract the route tests pinned earlier.
 */
export function extractRefreshToken(
    result: { data?: Record<string, unknown> } | null,
    setCookieHeaders: string[]
): string | undefined {
    const fromBody = result?.data?.refreshToken;
    if (typeof fromBody === 'string' && fromBody.length > 0) return fromBody;

    for (const header of setCookieHeaders) {
        const match = /^refreshToken=([^;]*)/.exec(header.trim());
        if (match?.[1]) return decodeURIComponent(match[1]);
    }

    return undefined;
}
