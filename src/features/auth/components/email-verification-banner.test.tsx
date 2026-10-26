// @vitest-environment jsdom
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { User } from '@/types';
import { useAuthStore } from '@/store/auth-store';
import { EmailVerificationBanner, resendCooldownRemaining } from './email-verification-banner';

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
    useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const BASE_USER: User = {
    id: 'u1',
    email: 'ada@example.com',
    firstName: 'Ada',
    lastName: 'Lovelace',
    role: 'user',
    plan: 'starter',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderBanner() {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return render(
        <QueryClientProvider client={client}>
            <EmailVerificationBanner />
        </QueryClientProvider>
    );
}

beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
    window.sessionStorage.clear();
});

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
});

describe('EmailVerificationBanner', () => {
    it('renders nothing without a user', () => {
        renderBanner();
        expect(screen.queryByTestId('email-verification-banner')).toBeNull();
    });

    it('renders nothing for a verified user or when the field is absent', () => {
        useAuthStore.setState({ user: { ...BASE_USER, emailVerified: true } });
        renderBanner();
        expect(screen.queryByTestId('email-verification-banner')).toBeNull();

        cleanup();
        useAuthStore.setState({ user: { ...BASE_USER } });
        renderBanner();
        expect(screen.queryByTestId('email-verification-banner')).toBeNull();
    });

    it('never auto-resends: only the explicit click hits the network', async () => {
        useAuthStore.setState({ user: { ...BASE_USER, emailVerified: false } });
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ success: true, data: { sent: true } }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        );
        vi.stubGlobal('fetch', fetchMock);

        renderBanner();
        expect(screen.getByTestId('email-verification-banner').textContent).toContain(
            'ada@example.com'
        );

        // Let effects and potential timers settle: still no request.
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(fetchMock).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: /Resend email/i }));

        await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
        expect(fetchMock.mock.calls[0][0]).toBe('/api/auth/resend-verification');
    });

    it('arms a 60s cooldown after a successful resend and persists it across reloads', async () => {
        useAuthStore.setState({ user: { ...BASE_USER, emailVerified: false } });
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(
                new Response(JSON.stringify({ success: true, data: { sent: true } }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                })
            )
        );

        renderBanner();
        fireEvent.click(screen.getByRole('button', { name: /Resend email/i }));

        const button = await screen.findByRole('button', { name: /Resend in \d+s/i });
        expect(button).toHaveProperty('disabled', true);
        expect(window.sessionStorage.getItem('verify-email-resend-after')).toBeTruthy();

        // Remount (as if the dashboard reloaded): cooldown survives.
        cleanup();
        renderBanner();
        expect(screen.getByRole('button', { name: /Resend in \d+s/i })).toHaveProperty(
            'disabled',
            true
        );
    });

    it('cooldown helper only counts down, never negative', () => {
        expect(resendCooldownRemaining(1_000 + 30_000, 1_000)).toBe(30);
        expect(resendCooldownRemaining(1_000, 61_000)).toBe(0);
    });
});
