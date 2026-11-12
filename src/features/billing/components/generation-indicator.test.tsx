// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { GenerationIndicator } from './generation-indicator';

const mocks = vi.hoisted(() => ({
    summary: null as unknown,
    credits: null as unknown,
}));

vi.mock('../hooks/use-billing', () => ({
    useBillingSummary: () => ({ data: mocks.summary }),
    useCredits: () => ({ data: mocks.credits }),
}));

const summary = {
    usage: [{ feature: 'ai.generation', used: 12, limit: 50, remaining: 38 }],
    quota: { 'ai.generation': 50 },
};

beforeEach(() => {
    mocks.summary = summary;
    mocks.credits = { balance: 240, held: 0, period: '2026-11', resetAt: null, plan: 'pro' };
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('generation indicator (P11.4)', () => {
    it('shows the server remaining quota', () => {
        render(<GenerationIndicator />);

        expect(screen.getByText(/38 generation left this month/i)).toBeTruthy();
    });

    it('shows the credit balance when the server reports one', () => {
        render(<GenerationIndicator />);

        expect(screen.getByText(/240 credits/i)).toBeTruthy();
    });

    it('never claims "0 credits" while the monthly grant is pending', () => {
        mocks.credits = { balance: 0, held: 0, period: '2026-11', resetAt: null, plan: 'starter' };

        render(<GenerationIndicator />);

        expect(screen.queryByText(/0 credits/i)).toBeNull();
        expect(screen.getByText(/38 generation left this month/i)).toBeTruthy();
    });

    it('says an unmetered feature is unlimited rather than inventing a number', () => {
        mocks.summary = { usage: [], quota: {} };

        render(<GenerationIndicator feature="project.members" />);

        expect(screen.getByText(/unlimited/i)).toBeTruthy();
    });
});
