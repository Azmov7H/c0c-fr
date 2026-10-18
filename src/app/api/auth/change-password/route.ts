import { NextRequest, NextResponse } from 'next/server';

import { changePasswordSchema } from '@/lib/auth-schemas';
import { relayAuthRequest, relayFailure, relayUnreachable } from '@/lib/auth-relay';
import { SESSION_COOKIE, REFRESH_COOKIE, clearCookieOptions } from '@/lib/auth-cookies';
import { enforceAuthBodyLimit, methodNotAllowed, readValidatedJson } from '@/lib/route-guards';

export function GET() {
    return methodNotAllowed(['POST']);
}

/**
 * Change password (T12). Authenticated via the session cookie — a Bearer on
 * the backend side; the browser never sees the token.
 *
 * On success the backend has bumped tokenVersion and revoked all refresh
 * tokens. The BFF clears BOTH cookies so the browser is signed out locally
 * too (the card's "new cookies" expectation is not possible: the backend
 * returns no replacement tokens). The UI then redirects to /login with an
 * explanation rather than leaving a stale session that 401s on next use.
 */
export async function POST(request: NextRequest) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE);
    if (!sessionCookie?.value) {
        return NextResponse.json(
            { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' } },
            { status: 401 }
        );
    }

    const tooLarge = enforceAuthBodyLimit(request);
    if (tooLarge) return tooLarge;

    const parsed = await readValidatedJson(request, changePasswordSchema);
    if (!parsed.ok) return parsed.response;

    try {
        const { status, body } = await relayAuthRequest('/api/v1/auth/change-password', {
            bearer: sessionCookie.value,
            body: {
                currentPassword: parsed.data.currentPassword,
                newPassword: parsed.data.newPassword,
            },
        });

        // 401 here means "current password is incorrect" — pass the backend's
        // human message through; the reference rule only applies to 5xx.
        if (status >= 400) return relayFailure('change-password', status, body);

        const res = NextResponse.json({ success: true, data: { revoked: true } });
        res.cookies.set(SESSION_COOKIE, '', clearCookieOptions());
        res.cookies.set(REFRESH_COOKIE, '', clearCookieOptions());
        return res;
    } catch {
        return relayUnreachable('change-password');
    }
}
