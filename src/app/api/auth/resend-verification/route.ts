import { NextRequest, NextResponse } from 'next/server';

import { resendVerificationSchema } from '@/lib/auth-schemas';
import { relayAuthRequest, relayFailure, relayUnreachable } from '@/lib/auth-relay';
import { SESSION_COOKIE } from '@/lib/auth-cookies';
import { enforceAuthBodyLimit, methodNotAllowed, readValidatedJson } from '@/lib/route-guards';

export function GET() {
    return methodNotAllowed(['POST']);
}

/**
 * Resend the verification email for the signed-in user (T12 banner).
 *
 * The 60-second cooldown is a UI affordance only — the backend endpoint is
 * idempotent and unthrottled beyond the global limiter, so the server never
 * relies on the client behaving.
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

    const parsed = await readValidatedJson(request, resendVerificationSchema);
    if (!parsed.ok) return parsed.response;

    try {
        const { status, body } = await relayAuthRequest('/api/v1/auth/resend-verification', {
            bearer: sessionCookie.value,
            body: {},
        });

        if (status >= 400) return relayFailure('resend-verification', status, body);

        return NextResponse.json({ success: true, data: { sent: true } }, { status });
    } catch {
        return relayUnreachable('resend-verification');
    }
}
