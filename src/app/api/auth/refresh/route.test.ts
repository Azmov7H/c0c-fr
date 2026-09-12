import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST } from './route';
import {
    buildBackendMock,
    makeRequest,
    cookiesOf,
} from '../../../../../tests/helpers/auth-route';

const backend = buildBackendMock();
const sessionName = process.env.NODE_ENV === 'production' ? '__Host-auth_session' : 'auth_session';
const refreshName = process.env.NODE_ENV === 'production' ? '__Host-refresh_token' : 'refresh_token';

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('BFF /api/auth/refresh', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('rotates: forwards refresh token in body, sets new session + refresh cookies', async () => {
        backend.install([
            {
                status: 200,
                body: {
                    success: true,
                    data: { accessToken: 'access-2', refreshToken: 'refresh-2' },
                },
            },
        ]);

        const res = await POST(
            makeRequest({ cookies: { [refreshName]: 'refresh-1' } })
        );

        expect(res.status).toBe(200);
        const cookies = cookiesOf(res);
        expect(cookies.find((c) => c.name === sessionName)?.value).toBe('access-2');
        expect(cookies.find((c) => c.name === refreshName)?.value).toBe('refresh-2');
    });

    it('clears cookies and returns 401 when refresh cookie is missing', async () => {
        const res = await POST(makeRequest({ cookies: {} }));
        expect(res.status).toBe(401);
        const cookies = cookiesOf(res);
        const session = cookies.find((c) => c.name === sessionName);
        const refresh = cookies.find((c) => c.name === refreshName);
        expect(session?.value).toBe('');
        expect(refresh?.value).toBe('');
    });

    it('clears cookies and returns 401 when backend rejects the refresh token', async () => {
        backend.install([
            {
                status: 401,
                body: { success: false, error: { code: 'UNAUTHORIZED', message: 'revoked' } },
            },
        ]);
        const res = await POST(
            makeRequest({ cookies: { [refreshName]: 'bad-token' } })
        );
        expect(res.status).toBe(401);
        const cookies = cookiesOf(res);
        expect(cookies.find((c) => c.name === sessionName)?.value).toBe('');
        expect(cookies.find((c) => c.name === refreshName)?.value).toBe('');
    });
});
