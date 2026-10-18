// @vitest-environment jsdom
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { FORGOT_PASSWORD_CONFIRMATION, ForgotPasswordForm } from './forgot-password-form';

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
    useSearchParams: () => new URLSearchParams(),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function renderForgot() {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return render(
        <QueryClientProvider client={client}>
            <ForgotPasswordForm />
        </QueryClientProvider>
    );
}

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
});

describe('ForgotPasswordForm', () => {
    it('shows the one generic confirmation, echoed by the backend and containing no account detail', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(
                JSON.stringify({
                    success: true,
                    data: { message: 'If an account exists for that address, a reset link has been sent.' },
                }),
                { status: 202, headers: { 'Content-Type': 'application/json' } }
            )
        );
        vi.stubGlobal('fetch', fetchMock);

        renderForgot();
        fireEvent.change(screen.getByLabelText(/Email Address/i), {
            target: { value: 'nobody@example.com' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Send Reset Link/i }));

        const confirmation = await screen.findByTestId('forgot-confirmation');
        expect(confirmation.textContent).toContain(FORGOT_PASSWORD_CONFIRMATION);
        // Non-enumeration: the copy can never reference the submitted address
        // or an existence outcome.
        expect(confirmation.textContent).not.toContain('nobody@example.com');
        expect(confirmation.textContent).not.toMatch(/not found|does not exist|no account/i);
    });

    it('offers a way back to the form for a different address', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(
                new Response(JSON.stringify({ success: true, data: { message: 'ok' } }), {
                    status: 202,
                    headers: { 'Content-Type': 'application/json' },
                })
            )
        );

        renderForgot();
        fireEvent.change(screen.getByLabelText(/Email Address/i), {
            target: { value: 'nobody@example.com' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Send Reset Link/i }));
        await screen.findByTestId('forgot-confirmation');

        fireEvent.click(screen.getByRole('button', { name: /Try a different email/i }));

        await waitFor(() =>
            expect((screen.getByLabelText(/Email Address/i) as HTMLInputElement).value).toBe('')
        );
    });
});
