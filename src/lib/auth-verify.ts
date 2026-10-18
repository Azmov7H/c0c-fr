import { jwtVerify, type JWTPayload } from 'jose';

/**
 * Verifies a BFF session cookie (which carries the backend's access token)
 * inside the Next middleware: signature, expiry, issuer, audience, algorithm
 * and token kind.
 *
 * The contract mirrors c0c-bake `src/core/auth/token.service.ts`:
 *   HS256 · iss "c0c-bake" · aud "c0c-api" · claim typ "access".
 * Keep these in step with the backend — a mismatch here makes every logged-in
 * user look logged out.
 *
 * The secret comes from `JWT_SECRET` (same value as the backend's). If it is
 * missing we throw and the caller fails closed (redirect to login) rather
 * than treating a token it cannot verify as valid.
 */

const ISSUER = 'c0c-bake';
const AUDIENCE = 'c0c-api';

export class SessionSecretMissingError extends Error {
    constructor() {
        super('JWT_SECRET is not configured; refusing to treat any token as valid (fail closed).');
        this.name = 'SessionSecretMissingError';
    }
}

export async function verifySessionToken(token: string): Promise<JWTPayload | null> {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new SessionSecretMissingError();

    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
            // Pin the algorithm: without this, a token could try to dictate its own,
            // which is the classic alg-confusion hole.
            algorithms: ['HS256'],
            issuer: ISSUER,
            audience: AUDIENCE,
        });

        // Refresh and ws tokens are related credentials with different audiences;
        // `typ` is the belt to the `aud` braces (backend ADR-003).
        if (payload.typ !== 'access') return null;

        return payload;
    } catch {
        // Signature mismatch, expiry, wrong iss/aud, malformed token — all invalid.
        return null;
    }
}
