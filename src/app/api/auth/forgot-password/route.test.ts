import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { GET, POST } from './route';
import { buildBackendMock, makeRequest } from '../../../../../tests/helpers/auth-route';

const backend = buildBackendMock();

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('BFF /api/auth/forgot-password', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('relays the backend 202 verbatim — identical body for existing and unknown accounts', async () => {
        const backendBody = {
            success: true,
            data: { message: 'If an account exists for that address, a reset link has been sent.' },
        };
        backend.install([
            { status: 202, body: backendBody },
            { status: 202, body: backendBody },
        ]);

        const first = await POST(makeRequest({ body: { email: 'real@example.com' } }));
        const second = await POST(makeRequest({ body: { email: 'nobody@example.com' } }));

        expect(first.status).toBe(202);
        expect(second.status).toBe(202);
        // Same status, same body shape — no existence signal.
        expect(await first.json()).toEqual(await second.json());
    });

    it('sends the email to the backend and nothing else', async () => {
        const installed = backend.install([
            { status: 202, body: { success: true, data: { message: 'ok' } } },
        ]);

        await POST(makeRequest({ body: { email: 'user@example.com' } }));

        expect(installed.calls).toHaveLength(1);
        expect(installed.calls[0].url).toContain('/api/v1/auth/forgot-password');
        expect(JSON.parse(String(installed.calls[0].init?.body))).toEqual({ email: 'user@example.com' });
    });

    it('rejects a malformed email with 400 before any backend call', async () => {
        const installed = backend.install([]);

        const res = await POST(makeRequest({ body: { email: 'not-an-email' } }));

        expect(res.status).toBe(400);
        expect(installed.calls).toHaveLength(0);
    });

    it('attaches a support reference on upstream 5xx', async () => {
        backend.install([
            { status: 500, body: { success: false, error: { code: 'SERVER_ERROR', message: 'boom' } } },
        ]);

        const res = await POST(makeRequest({ body: { email: 'user@example.com' } }));
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.error.reference).toMatch(/^AUTH-[0-9a-f]{8}$/);
    });

    it('returns 500 with a reference when the backend is unreachable', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));

        const res = await POST(makeRequest({ body: { email: 'user@example.com' } }));
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.error.reference).toMatch(/^AUTH-[0-9a-f]{8}$/);
    });

    it('rejects an oversized body (413) before any backend call', async () => {
        const installed = backend.install([]);

        const res = await POST(
            makeRequest({
                body: { email: 'a@b.c', pad: 'x' },
                headers: { 'content-length': String(64 * 1024 + 1) },
            })
        );

        expect(res.status).toBe(413);
        expect(installed.calls).toHaveLength(0);
    });

    it('a backend success response without a data payload surfaces null', async () => {
        backend.install([{ status: 200, body: { success: true } }]);

        const res = await POST(makeRequest({ body: { email: 'real@example.com' } }));

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.success).toBe(true);
        expect(body.data).toBe(null);
    });

    it('GET is a 405 naming POST', async () => {
        const res = GET();
        expect(res.status).toBe(405);
        expect(res.headers.get('allow')).toBe('POST');
    });
});
