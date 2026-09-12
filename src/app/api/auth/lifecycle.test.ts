import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST as login } from './login/route';
import { POST as refresh } from './refresh/route';
import { POST as logout } from './logout/route';
import {
    buildBackendMock,
    makeRequest,
    cookiesOf,
} from '../../../../tests/helpers/auth-route';

const sessionName = process.env.NODE_ENV === 'production' ? '__Host-auth_session' : 'auth_session';
const refreshName = process.env.NODE_ENV === 'production' ? '__Host-refresh_token' : 'refresh_token';

const backend = buildBackendMock();

afterEach(() => {
    vi.unstubAllGlobals();
});

/**
 * Full BFF lifecycle (TEST-02 — C-1/C-2 regression lock).
 * Removing the cookie/proxy path from the BFF routes would break this suite.
 */
describe('BFF full auth lifecycle (cookie-jar regression)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('login → refresh → logout: cookie-jar is correct at every step', async () => {
        // 1) login: backend returns tokens; BFF sets cookies.
        backend.install([
            {
                status: 200,
                body: {
                    success: true,
                    data: {
                        user: { id: 'u1', email: 'a@b.c' },
                        accessToken: 'access-1',
                        refreshToken: 'refresh-1',
                    },
                },
            },
        ]);

        const loginRes = await login(
            makeRequest({ body: { email: 'a@b.c', password: 'Password123' } })
        );
        expect(loginRes.status).toBe(200);
        let jar = cookiesOf(loginRes);
        expect(jar.find((c) => c.name === sessionName)?.value).toBe('access-1');
        expect(jar.find((c) => c.name === refreshName)?.value).toBe('refresh-1');

        // 2) refresh: simulate the browser sending the refresh cookie back.
        backend.install([
            {
                status: 200,
                body: {
                    success: true,
                    data: { accessToken: 'access-2', refreshToken: 'refresh-2' },
                },
            },
        ]);

        const refreshRes = await refresh(
            makeRequest({ cookies: { [refreshName]: 'refresh-1' } })
        );
        expect(refreshRes.status).toBe(200);
        jar = cookiesOf(refreshRes);
        expect(jar.find((c) => c.name === sessionName)?.value).toBe('access-2');
        expect(jar.find((c) => c.name === refreshName)?.value).toBe('refresh-2');

        // 3) logout: BFF calls backend with the (latest) access cookie, clears both.
        const fetchMock = vi.fn(async () => new Response('', { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);
        const logoutRes = await logout(
            makeRequest({ cookies: { [sessionName]: 'access-2' } })
        );
        expect(logoutRes.status).toBe(200);
        jar = cookiesOf(logoutRes);
        expect(jar.find((c) => c.name === sessionName)?.value).toBe('');
        expect(jar.find((c) => c.name === refreshName)?.value).toBe('');
    });
});
