import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { GET, POST } from './route';
import { buildBackendMock, makeRequest, cookiesOf } from '../../../../../tests/helpers/auth-route';

const backend = buildBackendMock();
const sessionName = process.env.NODE_ENV === 'production' ? '__Host-auth_session' : 'auth_session';
const refreshName = process.env.NODE_ENV === 'production' ? '__Host-refresh_token' : 'refresh_token';

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('BFF /api/auth/logout-all', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('clears both cookies and answers success even with no session', async () => {
        const installed = backend.install([]);

        const res = await POST(makeRequest({ body: {} }));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.data).toEqual({ revoked: true });
        expect(installed.calls).toHaveLength(0);

        const cookies = cookiesOf(res);
        expect(cookies.find((c) => c.name === sessionName)?.value).toBe('');
        expect(cookies.find((c) => c.name === refreshName)?.value).toBe('');
    });

    it('best effort: local sign-out succeeds even when the backend call fails', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));

        const res = await POST(
            makeRequest({ cookies: { [sessionName]: 'access-abc', [refreshName]: 'refresh-xyz' }, body: {} })
        );

        expect(res.status).toBe(200);
        const cookies = cookiesOf(res);
        expect(cookies.find((c) => c.name === sessionName)?.value).toBe('');
        expect(cookies.find((c) => c.name === refreshName)?.value).toBe('');
    });

    it('reaches the backend revocation endpoint with the session Bearer', async () => {
        const installed = backend.install([
            { status: 200, body: { success: true, data: { revoked: true } } },
        ]);

        const res = await POST(makeRequest({ cookies: { [sessionName]: 'access-abc' }, body: {} }));

        expect(res.status).toBe(200);
        expect(installed.calls[0].url).toContain('/api/v1/auth/logout-all');
        const headers = installed.calls[0].init?.headers as Record<string, string>;
        expect(headers.Authorization).toBe('Bearer access-abc');
    });

    it('rejects an oversized body before any backend revocation list call (413)', async () => {
        const installed = backend.install([]);

        const res = await POST(
            makeRequest({
                body: { pad: 'x' },
                headers: { 'content-length': String(64 * 1024 + 1) },
            })
        );

        expect(res.status).toBe(413);
        await expect(res.json()).resolves.toMatchObject({
            success: false,
            error: { code: 'PAYLOAD_TOO_LARGE' },
        });
        expect(installed.calls).toHaveLength(0);
    });

    it('GET is a 405 naming POST', () => {
        expect(GET().status).toBe(405);
    });
});
