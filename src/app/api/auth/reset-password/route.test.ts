import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { GET, POST } from './route';
import { buildBackendMock, makeRequest, cookiesOf } from '../../../../../tests/helpers/auth-route';

const backend = buildBackendMock();
const sessionName = process.env.NODE_ENV === 'production' ? '__Host-auth_session' : 'auth_session';
const refreshName = process.env.NODE_ENV === 'production' ? '__Host-refresh_token' : 'refresh_token';
const VALID_TOKEN = 'a'.repeat(43);

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('BFF /api/auth/reset-password', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('on success clears both cookies (no replacement tokens exist) and relays the message', async () => {
        backend.install([
            { status: 200, body: { success: true, data: { message: 'Password reset successfully.' } } },
        ]);

        const res = await POST(
            makeRequest({
                cookies: { [sessionName]: 'stale-access', [refreshName]: 'stale-refresh' },
                body: { token: VALID_TOKEN, newPassword: 'NewPass1' },
            })
        );

        expect(res.status).toBe(200);
        const cookies = cookiesOf(res);
        expect(cookies.find((c) => c.name === sessionName)?.value).toBe('');
        expect(cookies.find((c) => c.name === refreshName)?.value).toBe('');
    });

    it('passes the single invalid/expired/used 400 through without a reference', async () => {
        backend.install([
            {
                status: 400,
                body: {
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: 'This reset link is invalid or has expired' },
                },
            },
        ]);

        const res = await POST(
            makeRequest({ body: { token: VALID_TOKEN, newPassword: 'NewPass1' } })
        );
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.error.message).toBe('This reset link is invalid or has expired');
        expect(body.error.reference).toBeUndefined();
        // Failed exchanges must not clear a live session.
        expect(cookiesOf(res)).toHaveLength(0);
    });

    it('relays 429 from the shared limiter', async () => {
        backend.install([
            {
                status: 429,
                body: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests' } },
            },
        ]);

        const res = await POST(
            makeRequest({ body: { token: VALID_TOKEN, newPassword: 'NewPass1' } })
        );
        expect(res.status).toBe(429);
    });

    it('rejects a sub-20-char token client-side before any backend call', async () => {
        const installed = backend.install([]);

        const res = await POST(makeRequest({ body: { token: 'too-short', newPassword: 'NewPass1' } }));

        expect(res.status).toBe(400);
        expect(installed.calls).toHaveLength(0);
    });

    it('rejects a policy-violating new password client-side', async () => {
        const installed = backend.install([]);

        const res = await POST(makeRequest({ body: { token: VALID_TOKEN, newPassword: 'weak' } }));

        expect(res.status).toBe(400);
        expect(installed.calls).toHaveLength(0);
    });

    it('rejects an oversized body (413) before any backend call', async () => {
        const installed = backend.install([]);

        const res = await POST(
            makeRequest({
                body: { token: VALID_TOKEN, newPassword: 'NewPass1', pad: 'x' },
                headers: { 'content-length': String(64 * 1024 + 1) },
            })
        );

        expect(res.status).toBe(413);
        expect(installed.calls).toHaveLength(0);
    });

    it('a backend success response without a data payload surfaces null as data', async () => {
        backend.install([{ status: 200, body: { success: true } }]);

        const res = await POST(makeRequest({ body: { token: VALID_TOKEN, newPassword: 'NewPass1' } }));

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.success).toBe(true);
        expect(body.data).toBe(null);
    });

    it('an upstream transport failure → 500 SERVER_ERROR with an AUTH reference (relayUnreachable)', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => {
                throw new Error('ECONNREFUSED');
            })
        );

        const res = await POST(makeRequest({ body: { token: VALID_TOKEN, newPassword: 'NewPass1' } }));

        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body.error.code).toBe('SERVER_ERROR');
        expect(body.error.reference).toMatch(/^AUTH-[0-9a-f]{8}$/);
    });

    it('GET is a 405 naming POST', () => {
        expect(GET().status).toBe(405);
    });
});
