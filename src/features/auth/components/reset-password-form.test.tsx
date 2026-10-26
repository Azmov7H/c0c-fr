// @vitest-environment jsdom
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ResetPasswordForm } from './reset-password-form';

const nav = vi.hoisted(() => ({
    router: { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() },
    search: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => nav.router,
    useSearchParams: () => nav.search,
    usePathname: () => '/reset-password',
}));

vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const TOKEN = 'a'.repeat(43);

function renderReset() {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return render(
        <QueryClientProvider client={client}>
            <ResetPasswordForm />
        </QueryClientProvider>
    );
}

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    nav.search = new URLSearchParams();
});

describe('ResetPasswordForm', () => {
    it('missing token: explains the problem and offers a fresh link — never a password form', () => {
        renderReset();

        expect(screen.getByRole('alert').textContent).toContain('missing its token');
        expect(
            screen.getByRole('link', { name: /Request a new reset link/i })
        ).toHaveProperty('pathname', '/forgot-password');
        expect(screen.queryByLabelText('New Password')).toBeNull();
    });

    it('malformed token: says so without implying the token expired or was already used', () => {
        nav.search = new URLSearchParams(`token=${'abc'}`);

        renderReset();

        expect(screen.getByRole('alert').textContent).toContain('truncated');
    });

    it('valid token: scrubs the URL immediately and keeps the token only in memory', async () => {
        nav.search = new URLSearchParams(`token=${TOKEN}`);

        renderReset();

        await waitFor(() => expect(nav.router.replace).toHaveBeenCalledWith('/reset-password'));
        expect(screen.getByLabelText('New Password')).toBeTruthy();
    });

    it('rejects mismatched confirmation client-side', async () => {
        nav.search = new URLSearchParams(`token=${TOKEN}`);
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);

        renderReset();
        fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'NewPass1' } });
        fireEvent.change(screen.getByLabelText(/Confirm New Password/i), {
            target: { value: 'Different1' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Reset Password/i }));

        expect(await screen.findByText('Passwords do not match.')).toBeTruthy();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('400 from the backend shows the single invalid/expired message with the way out', async () => {
        nav.search = new URLSearchParams(`token=${TOKEN}`);
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(
                new Response(
                    JSON.stringify({
                        success: false,
                        error: { code: 'VALIDATION_ERROR', message: 'This reset link is invalid or has expired' },
                    }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                )
            )
        );

        renderReset();
        fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'NewPass1' } });
        fireEvent.change(screen.getByLabelText(/Confirm New Password/i), {
            target: { value: 'NewPass1' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Reset Password/i }));

        const alerts = await screen.findAllByRole('alert');
        expect(alerts.map((el) => el.textContent).join(' ')).toContain(
            'This reset link is invalid or has expired'
        );
        expect(
            screen.getAllByRole('link', { name: /Request a new one/i }).length
        ).toBeGreaterThan(0);
    });

    it('success posts {token, newPassword} and hands off to /login?reset=1', async () => {
        nav.search = new URLSearchParams(`token=${TOKEN}`);
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ success: true, data: { message: 'ok' } }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        );
        vi.stubGlobal('fetch', fetchMock);

        renderReset();
        fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'NewPass1' } });
        fireEvent.change(screen.getByLabelText(/Confirm New Password/i), {
            target: { value: 'NewPass1' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Reset Password/i }));

        await waitFor(() => expect(nav.router.push).toHaveBeenCalledWith('/login?reset=1'));
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('/api/auth/reset-password');
        expect(JSON.parse(String(init.body))).toEqual({ token: TOKEN, newPassword: 'NewPass1' });
    });
});
