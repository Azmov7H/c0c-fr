import { NextRequest, NextResponse } from 'next/server';

import { verifyEmailSchema } from '@/lib/auth-schemas';
import { relayAuthRequest, relayFailure, relayUnreachable } from '@/lib/auth-relay';
import { enforceAuthBodyLimit, methodNotAllowed, readValidatedJson } from '@/lib/route-guards';

export function GET() {
    return methodNotAllowed(['POST']);
}

/**
 * Public on purpose: a verification link is often opened on a device that is
 * not signed in. No cookies are touched — verification changes the account,
 * which the next session fetch will reflect (emailVerified: true).
 */
export async function POST(request: NextRequest) {
    const tooLarge = enforceAuthBodyLimit(request);
    if (tooLarge) return tooLarge;

    const parsed = await readValidatedJson(request, verifyEmailSchema);
    if (!parsed.ok) return parsed.response;

    try {
        const { status, body } = await relayAuthRequest('/api/v1/auth/verify-email', {
            body: { token: parsed.data.token },
        });

        if (status >= 400) return relayFailure('verify-email', status, body);

        return NextResponse.json(
            { success: true, data: (body as { data?: unknown } | null)?.data ?? { verified: true } },
            { status }
        );
    } catch {
        return relayUnreachable('verify-email');
    }
}
