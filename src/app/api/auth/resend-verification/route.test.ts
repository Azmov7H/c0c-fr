import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { GET, POST } from './route';
import { buildBackendMock, makeRequest } from '../../../../../tests/helpers/auth-route';

const backend = buildBackendMock();
const sessionName = process.env.NODE_ENV === 'production' ? '__Host-auth_session' : 'auth_session';

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('BFF /api/auth/resend-verification', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('requires a session cookie — 401 without touching the backend', async () => {
        const installed = backend.install([]);

        const res = await POST(makeRequest({ body: {} }));
        const body = await res.json();

        expect(res.status).toBe(401);
        expect(body.error.code).toBe('UNAUTHORIZED');
        expect(installed.calls).toHaveLength(0);
    });

    it('sends an empty body with the session Bearer and returns sent:true', async () => {
        const installed = backend.install([
            { status: 200, body: { success: true, data: { sent: true } } },
        ]);

        const res = await POST(makeRequest({ cookies: { [sessionName]: 'access-abc' }, body: {} }));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.data).toEqual({ sent: true });
        expect(installed.calls[0].url).toContain('/api/v1/auth/resend-verification');
        expect(JSON.parse(String(installed.calls[0].init?.body))).toEqual({});
    });

    it('relays backend failures with a reference on 5xx', async () => {
        backend.install([
            { status: 500, body: { success: false, error: { code: 'SERVER_ERROR', message: 'boom' } } },
        ]);

        const res = await POST(makeRequest({ cookies: { [sessionName]: 'access-abc' }, body: {} }));
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.error.reference).toMatch(/^AUTH-[0-9a-f]{8}$/);
    });

    it('an unauthenticated POST → 401 before anything else (no proxying without a session)', async () => {
        const installed = backend.install([]);

        const res = await POST(makeRequest({ body: {} }));

        expect(res.status).toBe(401);
        await expect(res.json()).resolves.toMatchObject({
            success: false,
            error: { code: 'UNAUTHORIZED' },
        });
        expect(installed.calls).toHaveLength(0);
    });

    it('rejects an oversized body (413) even with a valid session cookie', async () => {
        backend.install([]);

        const res = await POST(
            makeRequest({
                cookies: { [sessionName]: 'access-abc' },
                body: { pad: 'x' },
                headers: { 'content-length': String(64 * 1024 + 1) },
            })
        );

        expect(res.status).toBe(413);
        await expect(res.json()).resolves.toMatchObject({
            success: false,
            error: { code: 'PAYLOAD_TOO_LARGE' },
        });
    });

    it('a body the schema rejects → 400, backend never called', async () => {
        const installed = backend.install([]);

        const res = await POST(
            makeRequest({ cookies: { [sessionName]: 'access-abc' }, body: { junk: 'x' } })
        );

        expect(res.status).toBe(400);
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
            makeRequest({ cookies: { [sessionName]: 'access-abc' }, body: {} })
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
