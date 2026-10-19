// @vitest-environment jsdom
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { OnboardingWizard } from './onboarding-wizard';
import { completeState, emptyState, testOptions } from '../lib/test-fixtures';

const mocks = vi.hoisted(() => ({
    getOptions: vi.fn(),
    getState: vi.fn(),
    saveStep: vi.fn(),
    complete: vi.fn(),
    skip: vi.fn(),
    router: { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() },
}));

vi.mock('next/navigation', () => ({
    useRouter: () => mocks.router,
    usePathname: () => '/onboarding',
    useSearchParams: () => new URLSearchParams(),
}));

vi.mock('../services/onboarding.service', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../services/onboarding.service')>();
    return {
        ...actual,
        onboardingService: {
            getOptions: mocks.getOptions,
            getState: mocks.getState,
            saveStep: mocks.saveStep,
            complete: mocks.complete,
            skip: mocks.skip,
        },
    };
});

function renderWizard(props: { edit?: boolean } = {}) {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    render(
        <QueryClientProvider client={client}>
            <OnboardingWizard {...props} />
        </QueryClientProvider>
    );
    return client;
}

const heading = (name: RegExp) => screen.findByRole('heading', { name });
const clickRole = (role: 'radio' | 'checkbox', name: string | RegExp) =>
    fireEvent.click(screen.getByRole('radio' === role ? 'radio' : 'checkbox', { name }));

beforeEach(() => {
    mocks.getOptions.mockResolvedValue(testOptions);
    mocks.getState.mockResolvedValue(emptyState);
    mocks.saveStep.mockResolvedValue(emptyState);
    mocks.complete.mockResolvedValue({ ...completeState, seededProjectId: 'p1' });
    mocks.skip.mockResolvedValue(completeState);
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useRealTimers();
});

describe('OnboardingWizard', () => {
    it('renders step 1 of 6 and blocks advance with a visible reason', async () => {
        renderWizard();

        await heading(/What do you make content about/i);
        expect(screen.getByText(/Step 1 of 6/)).toBeTruthy();
        expect(document.querySelector('[aria-current="step"]')).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

        expect(await screen.findByRole('alert')).toBeTruthy();
        expect(screen.getByRole('alert').textContent).toMatch(/Choose one niche/i);
        expect(mocks.saveStep).not.toHaveBeenCalled();
    });

    it('walks all six steps, persisting each advance and keeping answers on Back', async () => {
        renderWizard();

        await heading(/What do you make content about/i);
        clickRole('radio', /Alpha niche/);
        fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

        await heading(/Which subtopics interest you/i);
        expect(mocks.saveStep).toHaveBeenLastCalledWith({ niche: 'alpha' });
        expect(screen.getByText(/Step 2 of 6/)).toBeTruthy();

        // Back preserves the answer (it is read from the draft, not reset).
        fireEvent.click(screen.getByRole('button', { name: 'Back' }));
        await heading(/What do you make content about/i);
        expect(
            screen.getByRole('radio', { name: /Alpha niche/ }).getAttribute('aria-checked')
        ).toBe('true');
        fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
        await heading(/Which subtopics interest you/i);

        clickRole('checkbox', 'Alpha one');
        clickRole('checkbox', 'Alpha two');
        clickRole('checkbox', 'Alpha three');
        fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

        await heading(/Where do you publish/i);
        expect(mocks.saveStep).toHaveBeenLastCalledWith({
            subtopics: ['Alpha one', 'Alpha two', 'Alpha three'],
        });

        clickRole('checkbox', 'YouTube');
        fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

        await heading(/How experienced are you/i);
        clickRole('radio', /Just starting out/);
        fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

        await heading(/What are you aiming for/i);
        expect(screen.getByText(/Step 5 of 6/)).toBeTruthy();
        clickRole('checkbox', /Goal one/);
        fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

        await heading(/Review your choices/i);
        expect(screen.getAllByText('Finish').length).toBeGreaterThan(0);
        expect(screen.getByText('Alpha niche')).toBeTruthy();
        expect(screen.getByText('Alpha one, Alpha two, Alpha three')).toBeTruthy();
        expect(screen.getByText('YouTube')).toBeTruthy();
        expect(screen.getByText('Just starting out')).toBeTruthy();
        expect(screen.getByText('Goal one')).toBeTruthy();
    });

    it('resumes at the server step with saved interests after a remount', async () => {
        mocks.getState.mockResolvedValue({
            ...emptyState,
            onboardingStep: 2,
            niche: 'Alpha one',
            interests: [
                { topic: 'Alpha one', weight: 1 },
                { topic: 'Alpha two', weight: 1 },
                { topic: 'Alpha three', weight: 1 },
            ],
        });

        renderWizard();
        await heading(/Where do you publish/i);
        expect(screen.getByText(/Step 3 of 6/)).toBeTruthy();

        // Unmount + remount: the answers come back from GET /users/onboarding.
        cleanup();
        renderWizard();
        await heading(/Where do you publish/i);

        fireEvent.click(screen.getByRole('button', { name: 'Back' }));
        await heading(/Which subtopics interest you/i);
        const checked = screen
            .getAllByRole('checkbox')
            .filter((box) => box.getAttribute('aria-checked') === 'true');
        expect(checked.map((box) => box.textContent)).toEqual([
            expect.stringContaining('Alpha one'),
            expect.stringContaining('Alpha two'),
            expect.stringContaining('Alpha three'),
        ]);
    });

    it('keeps completed answers when an advance fails, and the same button retries', async () => {
        mocks.saveStep
            .mockRejectedValueOnce({
                response: { data: { error: { code: 'NETWORK', message: 'Network down' } } },
            })
            .mockResolvedValue(emptyState);

        renderWizard();
        await heading(/What do you make content about/i);
        clickRole('radio', /Alpha niche/);
        fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

        const alert = await screen.findByRole('alert');
        expect(alert.textContent).toMatch(/Network down/);
        expect(alert.textContent).toMatch(/answers are safe/i);
        expect(
            screen.getByRole('radio', { name: /Alpha niche/ }).getAttribute('aria-checked')
        ).toBe('true');

        fireEvent.click(screen.getByRole('button', { name: /Try again/i }));
        await heading(/Which subtopics interest you/i);
        expect(mocks.saveStep).toHaveBeenCalledTimes(2);
    });

    it('offers Skip from step 1 only, with a confirmation explaining the trade-off', async () => {
        renderWizard();
        await heading(/What do you make content about/i);
        expect(screen.queryByRole('button', { name: /Skip for now/i })).toBeNull();

        clickRole('radio', /Alpha niche/);
        fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
        await heading(/Which subtopics interest you/i);

        fireEvent.click(screen.getByRole('button', { name: /Skip for now/i }));
        expect(await screen.findByText(/Skip personalisation\?/i)).toBeTruthy();
        expect(screen.getByText(/generic defaults/i)).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: /Skip onboarding/i }));
        await waitFor(() => expect(mocks.skip).toHaveBeenCalledWith('not_now'));
        await waitFor(() => expect(mocks.router.push).toHaveBeenCalledWith('/dashboard'));
    });

    it('shows an error with retry instead of an empty taxonomy', async () => {
        mocks.getOptions.mockRejectedValue(new Error('taxonomy unavailable'));

        renderWizard();
        expect(await screen.findByText(/Something went wrong/i)).toBeTruthy();
        expect(screen.queryAllByRole('radio')).toHaveLength(0);
        expect(screen.queryAllByRole('checkbox')).toHaveLength(0);

        mocks.getOptions.mockResolvedValue(testOptions);
        fireEvent.click(screen.getByRole('button', { name: /Try again/i }));
        await heading(/What do you make content about/i);
    });

    it('completes, surfaces the seeded project, then continues to the dashboard', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        mocks.getState.mockResolvedValue(completeState);

        renderWizard();
        await heading(/Review your choices/i);

        fireEvent.click(screen.getByRole('button', { name: /Finish onboarding/i }));

        expect(await screen.findByText(/Your first draft project is ready/i)).toBeTruthy();
        const link = screen.getByRole('link', { name: /Open my first project/i });
        expect(link.getAttribute('href')).toBe('/projects/p1');

        act(() => {
            vi.advanceTimersByTime(2600);
        });
        expect(mocks.router.push).toHaveBeenCalledWith('/dashboard');
    });

    it('re-onboarding does not re-complete, re-seed or re-save unchanged answers', async () => {
        mocks.getState.mockResolvedValue(completeState);

        renderWizard({ edit: true });
        await heading(/What do you make content about/i);
        expect(screen.getByText(/Update your interests/i)).toBeTruthy();

        const nextHeadings = [
            /Which subtopics interest you/i,
            /Where do you publish/i,
            /How experienced are you/i,
            /What are you aiming for/i,
            /Review your choices/i,
        ];
        for (const next of nextHeadings) {
            fireEvent.click(await screen.findByRole('button', { name: /Continue/i }));
            await heading(next);
        }
        fireEvent.click(screen.getByRole('button', { name: /Save and return/i }));

        await waitFor(() => expect(mocks.router.push).toHaveBeenCalledWith('/dashboard'));
        expect(mocks.complete).not.toHaveBeenCalled();
        // Nothing was edited, so each advance is a no-op — and crucially it does
        // not rewrite the saved step backwards.
        expect(mocks.saveStep).not.toHaveBeenCalled();
    });

    it('clears subtopics when the niche changes', async () => {
        renderWizard();

        await heading(/What do you make content about/i);
        clickRole('radio', /Alpha niche/);
        fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

        await heading(/Which subtopics interest you/i);
        clickRole('checkbox', 'Alpha one');
        clickRole('checkbox', 'Alpha two');
        clickRole('checkbox', 'Alpha three');

        fireEvent.click(screen.getByRole('button', { name: 'Back' }));
        await heading(/What do you make content about/i);
        clickRole('radio', /Beta niche/);
        fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

        await heading(/Which subtopics interest you/i);
        expect(mocks.saveStep).toHaveBeenLastCalledWith({ niche: 'beta' });
        expect(
            screen.getByRole('checkbox', { name: 'Beta one' }).getAttribute('aria-checked')
        ).toBe('false');
        expect(screen.queryByRole('checkbox', { name: 'Alpha one' })).toBeNull();
    });
});
