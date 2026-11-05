// @vitest-environment jsdom
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { LoginForm } from './login-form';

const nav = vi.hoisted(() => ({
    router: { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() },
    search: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => nav.router,
    useSearchParams: () => nav.search,
}));

vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function renderLogin() {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return render(
        <QueryClientProvider client={client}>
            <LoginForm />
        </QueryClientProvider>
    );
}

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    nav.search = new URLSearchParams();
});

describe('LoginForm', () => {
    it('renders the single generic credential message on 401 — never an existence signal', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(
                new Response(
                    JSON.stringify({
                        success: false,
                        error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' },
                    }),
                    { status: 401, headers: { 'Content-Type': 'application/json' } }
                )
            )
        );

        renderLogin();

        fireEvent.change(screen.getByLabelText(/Email Address/i), {
            target: { value: 'someone@example.com' },
        });
        fireEvent.change(screen.getByLabelText(/^Password$/i), {
            target: { value: 'whatever123' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Sign In to Dashboard/i }));

        const alert = await screen.findByRole('alert');
        expect(alert.textContent).toContain('Invalid email or password.');
        // The form must not echo the submitted address back as a hint.
        expect(alert.textContent).not.toContain('someone@example.com');
    });

    it('shows the post-redirect confirmation for ?reset=1', () => {
        nav.search = new URLSearchParams('reset=1');

        renderLogin();

        const status = screen.getByTestId('login-success');
        expect(status.textContent).toContain('Your password has been reset');
    });

    it('has an explicit path to recovery and to signup', () => {
        renderLogin();

        expect(screen.getByRole('link', { name: /Forgot password\?/i })).toHaveProperty(
            'pathname',
            '/forgot-password'
        );
        expect(screen.getByRole('link', { name: /Create Free Account/i })).toHaveProperty(
            'pathname',
            '/signup'
        );
    });
});
