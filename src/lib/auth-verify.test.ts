import { afterEach, describe, expect, it, vi } from 'vitest';
import { SignJWT } from 'jose';

import { SessionSecretMissingError, verifySessionToken } from './auth-verify';

/**
 * T18 — the middleware's verification contract (alg/iss/aud/typ must all hold,
 * and a missing JWT_SECRET must fail CLOSED). These two arms sit on the
 * security boundary: a token with the right audience but a different `typ`
 * (e.g. the refresh token) must never open a protected route.
 */
const SECRET = 't18-test-secret-at-least-32-bytes-long!';

async function mint(claims: Record<string, unknown>): Promise<string> {
    return new SignJWT(claims)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setIssuer('c0c-bake')
        .setAudience('c0c-api')
        .setExpirationTime('1h')
        .sign(new TextEncoder().encode(SECRET));
}

describe('verifySessionToken', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('missing secret → fail closed with SessionSecretMissingError', async () => {
        vi.stubEnv('JWT_SECRET', ''); // unset-like: empty string is falsy
        await expect(verifySessionToken('any')).rejects.toBeInstanceOf(SessionSecretMissingError);
    });

    it('a valid access-typ token passes through with its claims', async () => {
        vi.stubEnv('JWT_SECRET', SECRET);
        const token = await mint({ typ: 'access', sub: 'u1' });

        const payload = await verifySessionToken(token);

        expect(payload?.sub).toBe('u1');
        expect(payload?.typ).toBe('access');
    });

    it('a correctly signed token with typ "refresh" is NOT a session credential', async () => {
        vi.stubEnv('JWT_SECRET', SECRET);
        const token = await mint({ typ: 'refresh', sub: 'u1' });

        await expect(verifySessionToken(token)).resolves.toBeNull();
    });
});
