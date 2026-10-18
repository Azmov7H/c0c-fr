import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST } from './route';
import { buildBackendMock, makeRequest, cookiesOf } from '../../../../../tests/helpers/auth-route';

const backend = buildBackendMock();
const sessionName = process.env.NODE_ENV === 'production' ? '__Host-auth_session' : 'auth_session';
const refreshName = process.env.NODE_ENV === 'production' ? '__Host-refresh_token' : 'refresh_token';

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('BFF /api/auth/login', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('forwards login to backend, sets session + refresh cookies, never returns user_info cookie', async () => {
        backend.install([
            {
                status: 200,
                body: {
                    success: true,
                    data: {
                        user: { id: 'u1', email: 'a@b.c', firstName: 'A', lastName: 'B' },
                        accessToken: 'access-xyz',
                        refreshToken: 'refresh-abc',
                    },
                },
            },
        ]);

        const res = await POST(
            makeRequest({ body: { email: 'a@b.c', password: 'Password123' } })
        );

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.success).toBe(true);
        expect(body.data.user.email).toBe('a@b.c');

        const cookies = cookiesOf(res);
        const session = cookies.find((c) => c.name === sessionName);
        const refresh = cookies.find((c) => c.name === refreshName);
        expect(session?.value).toBe('access-xyz');
        expect(refresh?.value).toBe('refresh-abc');
        // No PII user_info cookie is ever set.
        expect(cookies.some((c) => c.name.includes('user_info'))).toBe(false);
    });

    it('promotes the backend Set-Cookie refresh token when the body has none (T02 contract)', async () => {
        backend.install([
            {
                status: 200,
                body: {
                    success: true,
                    data: {
                        user: { id: 'u1', email: 'a@b.c', firstName: 'A', lastName: 'B' },
                        accessToken: 'access-xyz',
                    },
                },
                headers: {
                    'Set-Cookie':
                        'refreshToken=backend-refresh-1; Max-Age=604800; Path=/api/v1/auth; HttpOnly; SameSite=Strict',
                },
            },
        ]);

        const res = await POST(
            makeRequest({ body: { email: 'a@b.c', password: 'Password123' } })
        );

        expect(res.status).toBe(200);
        const cookies = cookiesOf(res);
        expect(cookies.find((c) => c.name === sessionName)?.value).toBe('access-xyz');
        // Without this promotion, /api/auth/refresh has nothing to rotate and
        // every session silently dies when the access token expires.
        expect(cookies.find((c) => c.name === refreshName)?.value).toBe('backend-refresh-1');
    });

    it('passes through backend 401 with backend error envelope', async () => {        backend.install([
            {
                status: 401,
                body: {
                    success: false,
                    error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' },
                },
            },
        ]);

        const res = await POST(
            makeRequest({ body: { email: 'a@b.c', password: 'wrong' } })
        );

        expect(res.status).toBe(401);
        const body = await res.json();
        expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 400 on missing fields', async () => {
        const res = await POST(makeRequest({ body: { email: 'a@b.c' } }));
        expect(res.status).toBe(400);
    });
});
