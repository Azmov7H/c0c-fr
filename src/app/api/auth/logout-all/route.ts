import { NextRequest, NextResponse } from 'next/server';

import { relayAuthRequest } from '@/lib/auth-relay';
import { SESSION_COOKIE, REFRESH_COOKIE, clearCookieOptions } from '@/lib/auth-cookies';
import { enforceAuthBodyLimit, methodNotAllowed } from '@/lib/route-guards';

const REVOCATION_TIMEOUT_MS = 2000;

export function GET() {
    return methodNotAllowed(['POST']);
}

/**
 * Sign out everywhere (T12).
 *
 * Best-effort backend revocation with a hard timeout — the local sign-out
 * must succeed even when the backend is unreachable, exactly like /logout.
 * Both cookies are cleared unconditionally; the client additionally clears
 * its react-query cache so no cached private data survives the sign-out.
 */
export async function POST(request: NextRequest) {
    const tooLarge = enforceAuthBodyLimit(request);
    if (tooLarge) return tooLarge;

    const sessionCookie = request.cookies.get(SESSION_COOKIE);

    if (sessionCookie?.value) {
        try {
            await Promise.race([
                relayAuthRequest('/api/v1/auth/logout-all', {
                    bearer: sessionCookie.value,
                    timeoutMs: REVOCATION_TIMEOUT_MS,
                }),
                new Promise((resolve) => setTimeout(resolve, REVOCATION_TIMEOUT_MS)),
            ]);
        } catch {
            // Ignore network errors — local session must still be cleared.
        }
    }

    const res = NextResponse.json({ success: true, data: { revoked: true } });
    res.cookies.set(SESSION_COOKIE, '', clearCookieOptions());
    res.cookies.set(REFRESH_COOKIE, '', clearCookieOptions());
    return res;
}
