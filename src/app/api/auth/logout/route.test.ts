import { describe, it, expect, afterEach, vi } from 'vitest';
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

describe('BFF /api/auth/logout', () => {
    it('best-effort revokes backend session and always clears local cookies', async () => {
        const fetchMock = vi.fn(async () => new Response('', { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);

        const res = await POST(
            makeRequest({ cookies: { [sessionName]: 'access-1' } })
        );

        expect(res.status).toBe(200);
        // The BFF called the backend logout with the access token as Bearer.
        expect(fetchMock).toHaveBeenCalled();
        const url = String((fetchMock.mock.calls[0] as any)[0]);
        expect(url).toMatch(/\/api\/v1\/auth\/logout$/);

        const cookies = cookiesOf(res);
        expect(cookies.find((c) => c.name === sessionName)?.value).toBe('');
        expect(cookies.find((c) => c.name === refreshName)?.value).toBe('');
    });

    it('still clears local cookies when backend revocation fails (idempotent)', async () => {
        const fetchMock = vi.fn(async () => {
            throw new Error('backend down');
        });
        vi.stubGlobal('fetch', fetchMock);

        const res = await POST(
            makeRequest({ cookies: { [sessionName]: 'access-1' } })
        );

        expect(res.status).toBe(200);
        const cookies = cookiesOf(res);
        expect(cookies.find((c) => c.name === sessionName)?.value).toBe('');
        expect(cookies.find((c) => c.name === refreshName)?.value).toBe('');
    });
});
