import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { GET, POST } from './route';
import { buildBackendMock, makeRequest, cookiesOf } from '../../../../../tests/helpers/auth-route';

const backend = buildBackendMock();
const VALID_TOKEN = 'a'.repeat(43);

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('BFF /api/auth/verify-email', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('relays success and returns verified:true', async () => {
        backend.install([
            { status: 200, body: { success: true, data: { verified: true } } },
        ]);

        const res = await POST(makeRequest({ body: { token: VALID_TOKEN } }));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.data).toEqual({ verified: true });
        // Public route: no cookie is touched on success.
        expect(cookiesOf(res)).toHaveLength(0);
    });

    it('relays the invalid-link 400 with the backend message', async () => {
        backend.install([
            {
                status: 400,
                body: {
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: 'This verification link is invalid or has expired' },
                },
            },
        ]);

        const res = await POST(makeRequest({ body: { token: VALID_TOKEN } }));
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.error.message).toBe('This verification link is invalid or has expired');
        expect(body.error.reference).toBeUndefined();
    });

    it('rejects a short token before any backend call', async () => {
        const installed = backend.install([]);

        const res = await POST(makeRequest({ body: { token: 'nope' } }));

        expect(res.status).toBe(400);
        expect(installed.calls).toHaveLength(0);
    });

    it('attaches a support reference on upstream 5xx', async () => {
        backend.install([
            { status: 503, body: { success: false, error: { code: 'UNAVAILABLE', message: 'nope' } } },
        ]);

        const res = await POST(makeRequest({ body: { token: VALID_TOKEN } }));
        const body = await res.json();

        expect(res.status).toBe(503);
        expect(body.error.reference).toMatch(/^AUTH-[0-9a-f]{8}$/);
    });

    it('GET is a 405 naming POST', () => {
        expect(GET().status).toBe(405);
    });
});
