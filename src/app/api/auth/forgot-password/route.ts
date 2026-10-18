import { NextRequest, NextResponse } from 'next/server';

import { forgotPasswordSchema } from '@/lib/auth-schemas';
import { relayAuthRequest, relayFailure, relayUnreachable } from '@/lib/auth-relay';
import { enforceAuthBodyLimit, methodNotAllowed, readValidatedJson } from '@/lib/route-guards';

export function GET() {
    return methodNotAllowed(['POST']);
}

/**
 * Non-enumeration by construction: the backend answers 202 with the same body
 * whether or not the address exists, and this route relays that body verbatim.
 * Do not "improve" the copy here — an added "we couldn't find…" variant is the
 * classic account-existence leak (T12 / AUTH-05).
 */
export async function POST(request: NextRequest) {
    const tooLarge = enforceAuthBodyLimit(request);
    if (tooLarge) return tooLarge;

    const parsed = await readValidatedJson(request, forgotPasswordSchema);
    if (!parsed.ok) return parsed.response;

    try {
        const { status, body } = await relayAuthRequest('/api/v1/auth/forgot-password', {
            body: { email: parsed.data.email },
        });

        if (status >= 400) return relayFailure('forgot-password', status, body);

        return NextResponse.json(
            { success: true, data: (body as { data?: unknown } | null)?.data ?? null },
            { status }
        );
    } catch {
        return relayUnreachable('forgot-password');
    }
}
