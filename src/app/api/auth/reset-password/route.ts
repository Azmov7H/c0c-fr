import { NextRequest, NextResponse } from 'next/server';

import { resetPasswordSchema } from '@/lib/auth-schemas';
import { relayAuthRequest, relayFailure, relayUnreachable } from '@/lib/auth-relay';
import { SESSION_COOKIE, REFRESH_COOKIE, clearCookieOptions } from '@/lib/auth-cookies';
import { enforceAuthBodyLimit, methodNotAllowed, readValidatedJson } from '@/lib/route-guards';

export function GET() {
    return methodNotAllowed(['POST']);
}

/**
 * Exchange a one-time reset token for a new password.
 *
 * On success the backend has already revoked every refresh token for the
 * account (T02); the BFF additionally clears its own cookies. Deviation from
 * the T12 card, recorded in STATUS: the card expected "new cookies" on
 * success, but the backend issues no replacement tokens on reset — the user
 * is signed out everywhere and we send them to /login.
 */
export async function POST(request: NextRequest) {
    const tooLarge = enforceAuthBodyLimit(request);
    if (tooLarge) return tooLarge;

    const parsed = await readValidatedJson(request, resetPasswordSchema);
    if (!parsed.ok) return parsed.response;

    try {
        const { status, body } = await relayAuthRequest('/api/v1/auth/reset-password', {
            body: { token: parsed.data.token, newPassword: parsed.data.newPassword },
        });

        if (status >= 400) return relayFailure('reset-password', status, body);

        const res = NextResponse.json({
            success: true,
            data: (body as { data?: unknown } | null)?.data ?? null,
        });
        res.cookies.set(SESSION_COOKIE, '', clearCookieOptions());
        res.cookies.set(REFRESH_COOKIE, '', clearCookieOptions());
        return res;
    } catch {
        return relayUnreachable('reset-password');
    }
}
