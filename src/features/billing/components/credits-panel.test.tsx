// @vitest-environment jsdom
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ApiError } from '@/lib/api-error';
import type { CreditBalance, CreditEvent, CreditHistoryPage } from '@/features/billing/types';
import { CreditsPanel } from './credits-panel';

const mocks = vi.hoisted(() => ({
    getCredits: vi.fn(),
    getCreditHistory: vi.fn(),
}));

vi.mock('@/features/billing/services/billing.service', () => ({
    billingService: {
        getCredits: () => mocks.getCredits(),
        getCreditHistory: (page: number, limit: number) =>
            mocks.getCreditHistory(page, limit),
    },
}));

const balance = (overrides: Partial<CreditBalance> = {}): CreditBalance => ({
    balance: 450,
    held: 20,
    period: '2026-11',
    resetAt: '2026-11-30T00:00:00.000Z',
    plan: 'pro',
    ...overrides,
});

const event = (overrides: Partial<CreditEvent> = {}): CreditEvent => ({
    kind: 'settle',
    amount: 3,
    balanceAfter: 447,
    heldAfter: 0,
    createdAt: '2026-11-05T09:00:00.000Z',
    ...overrides,
});

function historyPage(page: number, overrides: Partial<CreditHistoryPage> = {}): CreditHistoryPage {
    const events =
        page === 1
            ? [event()]
            : [];
    return { events, total: 1, limit: 10, ...overrides };
}

function renderPanel() {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return render(
        <QueryClientProvider client={client}>
            <CreditsPanel />
        </QueryClientProvider>
    );
}

beforeEach(() => {
    mocks.getCredits.mockResolvedValue(balance());
    mocks.getCreditHistory.mockImplementation((page: number) =>
        Promise.resolve(
            historyPage(page, {
                events: page === 1 ? [event()] : [],
                total: 1,
            })
        )
    );
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('credits panel', () => {
    it('shows the server balance, the held amount and the cycle', async () => {
        renderPanel();

        expect(await screen.findByText('450 available')).toBeTruthy();
        expect(screen.getAllByText('20 held').length).toBeGreaterThan(0);
        expect(screen.getByText('In progress')).toBeTruthy();
        expect(screen.getByText('450')).toBeTruthy();
        expect(screen.getByText(/2026-11 — resets Nov 30, 2026/)).toBeTruthy();
        // The settle is visible once the ledger loads.
        expect(await screen.findByText('Generation charged')).toBeTruthy();
    });

    it('renders a 402 (insufficient credits) as a recoverable error, not a crash', async () => {
        mocks.getCredits.mockRejectedValue(
            new ApiError({
                code: 'TOKEN_INSUFFICIENT',
                message: 'Not enough credits to cover this operation.',
                status: 402,
            })
        );

        renderPanel();
        // The rejection resolves as a microtask: the error branch shows, no crash.
        expect(await screen.findByText('Something went wrong')).toBeTruthy();
        expect(
            await screen.findByText('Not enough credits to cover this operation.')
        ).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: /try again/i }));
        expect(mocks.getCredits).toHaveBeenCalledTimes(2);
    });

    it('lists ledger rows with their notes and paginates', async () => {
        mocks.getCreditHistory.mockImplementation((page: number) =>
            Promise.resolve(
                historyPage(page, {
                    events:
                        page === 1
                            ? [
                                  event({ kind: 'settle', note: 'Over-reserve released: 2' }),
                                  event({ kind: 'reserve', note: 'estimate for scripts.generate' }),
                              ]
                            : [event({ kind: 'grant', amount: 500 })],
                    total: 25,
                })
            )
        );

        renderPanel();

        expect(
            await screen.findByText('Generation charged — Over-reserve released: 2')
        ).toBeTruthy();
        expect(await screen.findByText('Reserved for a generation — scripts.generate')).toBeTruthy();
        expect(await screen.findByText('Page 1 of 3')).toBeTruthy();
        expect(screen.getByRole('button', { name: /newer/i })).toBeDisabled();
        fireEvent.click(screen.getByRole('button', { name: /older/i }));
        expect(await screen.findByText('Page 2 of 3')).toBeTruthy();
        expect(await screen.findByText('Monthly credit grant')).toBeTruthy();
    });

    it('shows the held column as "None" when nothing is in flight', async () => {
        mocks.getCredits.mockResolvedValue(balance({ held: 0 }));

        renderPanel();

        expect(await screen.findByText('In progress')).toBeTruthy();
        expect(await screen.findByText('None')).toBeTruthy();
    });

    it('uses the empty state when the ledger has no rows yet', async () => {
        mocks.getCreditHistory.mockResolvedValue(historyPage(1, { events: [], total: 0 }));

        renderPanel();

        expect(await screen.findByText('No credit activity yet')).toBeTruthy();
        expect(screen.queryByRole('button', { name: /older/i })).toBeNull();
    });
});
