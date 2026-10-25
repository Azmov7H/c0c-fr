import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { GET, POST } from './route';
import { buildBackendMock, makeRequest, cookiesOf } from '../../../../../tests/helpers/auth-route';

const backend = buildBackendMock();
const sessionName = process.env.NODE_ENV === 'production' ? '__Host-auth_session' : 'auth_session';
const refreshName = process.env.NODE_ENV === 'production' ? '__Host-refresh_token' : 'refresh_token';

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('BFF /api/auth/change-password', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('requires a session cookie — 401 without touching the backend', async () => {
        const installed = backend.install([]);

        const res = await POST(
            makeRequest({ body: { currentPassword: 'old', newPassword: 'NewPass1' } })
        );
        const body = await res.json();

        expect(res.status).toBe(401);
        expect(body.error.code).toBe('UNAUTHORIZED');
        expect(installed.calls).toHaveLength(0);
    });

    it('sends the session as a Bearer and clears both cookies on success', async () => {
        const installed = backend.install([
            { status: 200, body: { success: true, data: { revoked: true } } },
        ]);

        const res = await POST(
            makeRequest({
                cookies: { [sessionName]: 'access-abc', [refreshName]: 'refresh-xyz' },
                body: { currentPassword: 'old', newPassword: 'NewPass1' },
            })
        );

        expect(res.status).toBe(200);
        expect(installed.calls[0].url).toContain('/api/v1/auth/change-password');
        const headers = installed.calls[0].init?.headers as Record<string, string>;
        expect(headers.Authorization).toBe('Bearer access-abc');

        const cookies = cookiesOf(res);
        expect(cookies.find((c) => c.name === sessionName)?.value).toBe('');
        expect(cookies.find((c) => c.name === refreshName)?.value).toBe('');
    });

    it('relays the wrong-current-password 401 message without a reference', async () => {
        backend.install([
            {
                status: 401,
                body: {
                    success: false,
                    error: { code: 'UNAUTHORIZED', message: 'Current password is incorrect' },
                },
            },
        ]);

        const res = await POST(
            makeRequest({
                cookies: { [sessionName]: 'access-abc' },
                body: { currentPassword: 'wrong', newPassword: 'NewPass1' },
            })
        );
        const body = await res.json();

        expect(res.status).toBe(401);
        expect(body.error.message).toBe('Current password is incorrect');
        expect(body.error.reference).toBeUndefined();
        // The live session survives a failed change.
        expect(cookiesOf(res)).toHaveLength(0);
    });

    it('attaches a support reference on upstream 5xx and does not clear the session', async () => {
        backend.install([
            { status: 500, body: { success: false, error: { code: 'SERVER_ERROR', message: 'boom' } } },
        ]);

        const res = await POST(
            makeRequest({
                cookies: { [sessionName]: 'access-abc' },
                body: { currentPassword: 'old', newPassword: 'NewPass1' },
            })
        );
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.error.reference).toMatch(/^AUTH-[0-9a-f]{8}$/);
        expect(cookiesOf(res)).toHaveLength(0);
    });

    it('rejects a policy-violating new password client-side', async () => {
        const installed = backend.install([]);

        const res = await POST(
            makeRequest({
                cookies: { [sessionName]: 'access-abc' },
                body: { currentPassword: 'old', newPassword: 'weak' },
            })
        );

        expect(res.status).toBe(400);
        expect(installed.calls).toHaveLength(0);
    });

    it('a POST without a session cookie → 401, backend never called', async () => {
        const installed = backend.install([]);

        const res = await POST(
            makeRequest({ body: { currentPassword: 'old', newPassword: 'NewPass1' } })
        );

        expect(res.status).toBe(401);
        await expect(res.json()).resolves.toMatchObject({
            success: false,
            error: { code: 'UNAUTHORIZED' },
        });
        expect(installed.calls).toHaveLength(0);
    });

    it('rejects an oversized body (413) before any backend call', async () => {
        const installed = backend.install([]);

        const res = await POST(
            makeRequest({
                cookies: { [sessionName]: 'access-abc' },
                body: { currentPassword: 'old', newPassword: 'NewPass1', pad: 'x' },
                headers: { 'content-length': String(64 * 1024 + 1) },
            })
        );

        expect(res.status).toBe(413);
        expect(installed.calls).toHaveLength(0);
    });

    it('an upstream transport failure → 500 SERVER_ERROR with an AUTH reference (relayUnreachable)', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => {
                throw new Error('ECONNREFUSED');
            })
        );

        const res = await POST(
            makeRequest({ cookies: { [sessionName]: 'access-abc' }, body: { currentPassword: 'old', newPassword: 'NewPass1' } })
        );

        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body.error.code).toBe('SERVER_ERROR');
        expect(body.error.reference).toMatch(/^AUTH-[0-9a-f]{8}$/);
    });

    it('GET is a 405 naming POST', () => {
        expect(GET().status).toBe(405);
    });
});
