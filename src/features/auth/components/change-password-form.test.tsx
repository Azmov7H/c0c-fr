// @vitest-environment jsdom
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { User } from '@/types';
import { useAuthStore } from '@/store/auth-store';
import { ChangePasswordForm } from './change-password-form';

const nav = vi.hoisted(() => ({
    router: { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() },
}));

vi.mock('next/navigation', () => ({
    useRouter: () => nav.router,
    useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const USER: User = {
    id: 'u1',
    email: 'ada@example.com',
    firstName: 'Ada',
    lastName: 'Lovelace',
    role: 'user',
    plan: 'starter',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
};

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
});

describe('ChangePasswordForm', () => {
    it('warns BEFORE submit that every device will be signed out', () => {
        const client = new QueryClient();
        render(
            <QueryClientProvider client={client}>
                <ChangePasswordForm />
            </QueryClientProvider>
        );

        expect(screen.getByText(/signs you out everywhere/i)).toBeTruthy();
        expect(screen.getByRole('alert').textContent).toMatch(/other devices/i);
    });

    it('on success clears the query cache, logs out and redirects to /login?changed=1', async () => {
        const client = new QueryClient({
            defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
        });
        // Seed private data that must not survive the forced sign-out.
        client.setQueryData(['projects'], [{ id: 'p1' }]);
        useAuthStore.setState({ user: USER, isAuthenticated: true, isLoading: false });

        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(
                new Response(JSON.stringify({ success: true, data: { revoked: true } }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                })
            )
        );

        render(
            <QueryClientProvider client={client}>
                <ChangePasswordForm />
            </QueryClientProvider>
        );

        fireEvent.change(screen.getByLabelText(/Current Password/i), {
            target: { value: 'OldPass1' },
        });
        fireEvent.change(screen.getByLabelText(/^New Password$/i), {
            target: { value: 'NewPass1' },
        });
        fireEvent.change(screen.getByLabelText(/Confirm New Password/i), {
            target: { value: 'NewPass1' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Change Password/i }));

        await waitFor(() => expect(nav.router.push).toHaveBeenCalledWith('/login?changed=1'));
        expect(client.getQueryData(['projects'])).toBeUndefined();
        expect(useAuthStore.getState().user).toBeNull();
        expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('keeps the session on a wrong-current-password 401 and shows the backend message', async () => {
        const client = new QueryClient({
            defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
        });
        useAuthStore.setState({ user: USER, isAuthenticated: true, isLoading: false });

        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(
                new Response(
                    JSON.stringify({
                        success: false,
                        error: { code: 'UNAUTHORIZED', message: 'Current password is incorrect' },
                    }),
                    { status: 401, headers: { 'Content-Type': 'application/json' } }
                )
            )
        );

        render(
            <QueryClientProvider client={client}>
                <ChangePasswordForm />
            </QueryClientProvider>
        );

        fireEvent.change(screen.getByLabelText(/Current Password/i), {
            target: { value: 'WrongPass1' },
        });
        fireEvent.change(screen.getByLabelText(/^New Password$/i), {
            target: { value: 'NewPass1' },
        });
        fireEvent.change(screen.getByLabelText(/Confirm New Password/i), {
            target: { value: 'NewPass1' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Change Password/i }));

        expect(await screen.findByText('Current password is incorrect')).toBeTruthy();
        expect(useAuthStore.getState().isAuthenticated).toBe(true);
        expect(nav.router.push).not.toHaveBeenCalledWith('/login?changed=1');
    });
});
