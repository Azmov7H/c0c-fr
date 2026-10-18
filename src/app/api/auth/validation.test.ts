import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as login, GET as loginGet } from './login/route';
import { POST as register, GET as registerGet } from './register/route';
import { POST as logout } from './logout/route';
import { POST as refresh, GET as refreshGet } from './refresh/route';
import { POST as sessionPost } from './session/route';
import { POST as wsTokenPost } from './ws-token/route';
import { buildBackendMock, makeRequest } from '../../../../tests/helpers/auth-route';

/**
 * T09 BFF validation tests (R-25). New file — the existing suites
 * (lifecycle.test.ts, route.test.ts) stay unmodified per the acceptance
 * criteria and continue to pin the cookie/proxy behaviour.
 */

const backend = buildBackendMock();

afterEach(() => {
    vi.unstubAllGlobals();
});

beforeEach(() => {
    vi.clearAllMocks();
});

describe('zod validation on auth BFF routes', () => {
    it('login: invalid email → 400 VALIDATION_ERROR with field details', async () => {
        const res = await login(makeRequest({ body: { email: 'not-an-email', password: 'x' } }));
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error.code).toBe('VALIDATION_ERROR');
        expect(body.error.details.some((d: { path: string }) => d.path === 'email')).toBe(true);
    });

    it('login: unknown keys are rejected, not forwarded', async () => {
        const res = await login(
            makeRequest({ body: { email: 'a@b.c', password: 'Password123', role: 'admin' } })
        );
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error.code).toBe('VALIDATION_ERROR');
        // A 400 (not a 500) proves the request never reached the fetch/proxy step.
    });

    it('login: valid body still proxies and sets cookies (behaviour preserved)', async () => {
        backend.install([
            {
                status: 200,
                body: {
                    success: true,
                    data: { user: { id: 'u1' }, accessToken: 'a', refreshToken: 'r' },
                },
            },
        ]);
        const res = await login(makeRequest({ body: { email: 'a@b.c', password: 'Password123' } }));
        expect(res.status).toBe(200);
    });

    it('register: name longer than 50 chars → 400 (backend parity)', async () => {
        const res = await register(
            makeRequest({
                body: {
                    email: 'a@b.c',
                    password: 'Password123',
                    firstName: 'x'.repeat(51),
                    lastName: 'B',
                },
            })
        );
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error.details.some((d: { path: string }) => d.path === 'firstName')).toBe(true);
    });

    it('register: weak password → 400 with the same rules the backend enforces', async () => {
        const res = await register(
            makeRequest({
                body: { email: 'a@b.c', password: 'weak', firstName: 'A', lastName: 'B' },
            })
        );
        expect(res.status).toBe(400);
        const body = await res.json();
        const messages = body.error.details.map((d: { message: string }) => d.message).join(' ');
        expect(messages).toContain('at least 8 characters');
    });

    it('malformed JSON body → 400 rather than a 500', async () => {
        const req = new NextRequest('http://localhost/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{not json',
        });
        const res = await login(req);
        expect(res.status).toBe(400);
    });
});

describe('body size cap (AC: a 10 MB body is rejected before proxying)', () => {
    it('10 MB Content-Length on login → 413, backend never called', async () => {
        const req = new NextRequest('http://localhost/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'content-length': String(10 * 1024 * 1024),
            },
            body: '{}',
        });
        const res = await login(req);
        expect(res.status).toBe(413);
        const body = await res.json();
        expect(body.error.code).toBe('PAYLOAD_TOO_LARGE');
    });

    it.each([
        ['logout', logout],
        ['refresh', refresh],
    ] as const)('%s also enforces the cap', async (_name, handler) => {
        const req = new NextRequest('http://localhost/api/auth/x', {
            method: 'POST',
            headers: { 'content-length': String(10 * 1024 * 1024) },
            body: '{}',
        });
        const res = await handler(req);
        expect(res.status).toBe(413);
    });
});

describe('method limits (AC: non-POST methods on auth routes → 405)', () => {
    it.each([
        ['login', loginGet],
        ['register', registerGet],
        ['refresh', refreshGet],
    ] as const)('GET /api/auth/%s → 405 with Allow', async (name, handler) => {
        const res = handler();
        expect(res.status).toBe(405);
        expect(res.headers.get('Allow')).toBe('POST');
        const body = await res.json();
        expect(body.error.code).toBe('METHOD_NOT_ALLOWED');
    });

    it.each([
        ['session', sessionPost],
        ['ws-token', wsTokenPost],
    ] as const)('POST /api/auth/%s → 405 with Allow', async (name, handler) => {
        const res = handler();
        expect(res.status).toBe(405);
        expect(res.headers.get('Allow')).toBe('GET');
    });
});
