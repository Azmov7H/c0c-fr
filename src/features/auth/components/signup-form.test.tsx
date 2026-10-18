// @vitest-environment jsdom
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { SignupForm } from './signup-form';

const nav = vi.hoisted(() => ({
    router: { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() },
}));

vi.mock('next/navigation', () => ({
    useRouter: () => nav.router,
    useSearchParams: () => new URLSearchParams(),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function renderSignup() {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return render(
        <QueryClientProvider client={client}>
            <SignupForm />
        </QueryClientProvider>
    );
}

function fillValidFields() {
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Lovelace' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'ada@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'Password1' } });
}

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
});

describe('SignupForm', () => {
    it('blocks submission on missing fields, weak password and unchecked terms', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);

        renderSignup();
        fireEvent.click(screen.getByRole('button', { name: /Create Free Account/i }));

        expect(await screen.findByText('First name is required.')).toBeTruthy();
        expect(screen.getByText('Last name is required.')).toBeTruthy();
        expect(screen.getByText('Invalid email address.')).toBeTruthy();
        expect(screen.getByText('Password must be at least 8 characters.')).toBeTruthy();
        expect(
            screen.getByText('You must accept the Terms of Service and Privacy Policy.')
        ).toBeTruthy();

        // Validation failures never hit the network.
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('submits without the acceptedTerms field and routes to the dashboard', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(
                JSON.stringify({
                    success: true,
                    data: {
                        user: {
                            id: 'u1',
                            email: 'ada@example.com',
                            firstName: 'Ada',
                            lastName: 'Lovelace',
                            emailVerified: false,
                        },
                    },
                }),
                { status: 201, headers: { 'Content-Type': 'application/json' } }
            )
        );
        vi.stubGlobal('fetch', fetchMock);

        renderSignup();
        fillValidFields();
        fireEvent.click(screen.getByRole('checkbox'));
        fireEvent.click(screen.getByRole('button', { name: /Create Free Account/i }));

        await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('/api/auth/register');
        const sent = JSON.parse(String(init.body));
        expect(sent).toEqual({
            firstName: 'Ada',
            lastName: 'Lovelace',
            email: 'ada@example.com',
            password: 'Password1',
        });
        expect('acceptedTerms' in sent).toBe(false);

        await waitFor(() => expect(nav.router.push).toHaveBeenCalledWith('/dashboard'));
    });

    it('strength meter reports all requirements met for a policy-compliant password', () => {
        renderSignup();

        fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'Password1' } });

        expect(screen.getByRole('img', { name: /Password strength: 4 of 4/i })).toBeTruthy();
    });

    it('states the interest-selection value proposition and links the legal pages', () => {
        renderSignup();

        expect(screen.getByText(/pick your interests/i)).toBeTruthy();
        expect(screen.getByRole('link', { name: /Terms of Service/i })).toHaveProperty(
            'pathname',
            '/terms'
        );
        expect(screen.getByRole('link', { name: /Privacy Policy/i })).toHaveProperty(
            'pathname',
            '/privacy'
        );
    });
});
