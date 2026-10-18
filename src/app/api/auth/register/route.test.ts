import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { GET, POST } from './route';
import { buildBackendMock, makeRequest, cookiesOf } from '../../../../../tests/helpers/auth-route';

const backend = buildBackendMock();
const sessionName = process.env.NODE_ENV === 'production' ? '__Host-auth_session' : 'auth_session';
const refreshName = process.env.NODE_ENV === 'production' ? '__Host-refresh_token' : 'refresh_token';

const VALID_BODY = {
    email: 'a@b.c',
    password: 'Password1',
    firstName: 'Ada',
    lastName: 'Lovelace',
};

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('BFF /api/auth/register', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('promotes the backend Set-Cookie refresh token onto the BFF cookie and returns the user', async () => {
        const installed = backend.install([
            {
                status: 201,
                body: {
                    success: true,
                    data: {
                        user: { id: 'u1', email: 'a@b.c', firstName: 'Ada', lastName: 'Lovelace', emailVerified: false },
                        accessToken: 'access-new',
                    },
                },
                headers: {
                    'Set-Cookie':
                        'refreshToken=register-refresh-1; Max-Age=604800; Path=/api/v1/auth; HttpOnly; SameSite=Strict',
                },
            },
        ]);

        const res = await POST(makeRequest({ body: VALID_BODY }));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.data.user.emailVerified).toBe(false);
        // Token shapes never leak into the page-visible JSON.
        expect(JSON.stringify(body)).not.toContain('access-new');
        expect(JSON.stringify(body)).not.toContain('register-refresh-1');

        expect(installed.calls[0].url).toContain('/api/v1/auth/register');
        const cookies = cookiesOf(res);
        expect(cookies.find((c) => c.name === sessionName)?.value).toBe('access-new');
        expect(cookies.find((c) => c.name === refreshName)?.value).toBe('register-refresh-1');
    });

    it('still accepts the legacy body refreshToken', async () => {
        backend.install([
            {
                status: 201,
                body: {
                    success: true,
                    data: {
                        user: { id: 'u1', email: 'a@b.c', firstName: 'Ada', lastName: 'Lovelace' },
                        accessToken: 'access-new',
                        refreshToken: 'body-refresh',
                    },
                },
            },
        ]);

        const res = await POST(makeRequest({ body: VALID_BODY }));

        expect(cookiesOf(res).find((c) => c.name === refreshName)?.value).toBe('body-refresh');
    });

    it('rejects unknown keys before any backend call', async () => {
        const installed = backend.install([]);

        const res = await POST(makeRequest({ body: { ...VALID_BODY, role: 'admin' } }));

        expect(res.status).toBe(400);
        expect(installed.calls).toHaveLength(0);
    });

    it('GET is a 405 naming POST', () => {
        expect(GET().status).toBe(405);
    });
});
