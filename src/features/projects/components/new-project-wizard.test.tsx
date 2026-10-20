// @vitest-environment jsdom
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ApiError } from '@/lib/api-error';
import { writeProjectDraft } from '../lib/project-draft';
import { NewProjectWizard } from './new-project-wizard';

interface CreateCallbacks {
    onSuccess: (project: { _id: string }) => void;
    onError: (error: unknown) => void;
}

const mocks = vi.hoisted(() => ({
    replace: vi.fn(),
    push: vi.fn(),
    mutate: vi.fn(),
    toastError: vi.fn(),
    toastSuccess: vi.fn(),
    onboarding: {
        data: undefined as
            | {
                  preferredPlatforms: string[];
                  interests: Array<{ topic: string; weight: number }>;
              }
            | undefined,
    },
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ replace: mocks.replace, push: mocks.push }),
}));

vi.mock('sonner', () => ({
    toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

vi.mock('@/features/onboarding/hooks/use-onboarding', () => ({
    useOnboardingState: () => mocks.onboarding,
}));

vi.mock('../hooks/use-projects', () => ({
    useCreateProject: () => ({ mutate: mocks.mutate, isPending: false }),
}));

const fillStepOne = (title = 'My video', idea = 'A clear idea for the video.') => {
    fireEvent.change(screen.getByLabelText('Project title'), { target: { value: title } });
    fireEvent.change(screen.getByLabelText('The idea'), { target: { value: idea } });
};

const goToReview = async () => {
    fillStepOne();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    await screen.findByText('Platform');
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    await screen.findByText('Platform and tone');
};

beforeEach(() => {
    window.sessionStorage.clear();
    mocks.onboarding.data = undefined;
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('NewProjectWizard', () => {
    it('cannot submit twice while the first request is in flight', async () => {
        render(<NewProjectWizard />);
        await goToReview();

        const submit = screen.getByRole('button', { name: /^Create/ });
        fireEvent.click(submit);
        fireEvent.click(submit);

        await waitFor(() => expect(mocks.mutate).toHaveBeenCalledTimes(1));
    });

    it('routes an onboarding 428 to the wizard with an explanation', async () => {
        mocks.mutate.mockImplementation((_values: unknown, options: CreateCallbacks) => {
            options.onError(
                new ApiError({
                    code: 'ONBOARDING_INCOMPLETE',
                    message: 'Complete onboarding before creating a project.',
                    status: 428,
                })
            );
        });

        render(<NewProjectWizard />);
        await goToReview();
        fireEvent.click(screen.getByRole('button', { name: /^Create/ }));

        await waitFor(() =>
            expect(mocks.push).toHaveBeenCalledWith('/onboarding?from=create-project')
        );
        expect(mocks.toastError).toHaveBeenCalledWith(
            'Finish onboarding before creating a project.'
        );
    });

    it('restores an autosaved draft and says so instead of silently filling', async () => {
        writeProjectDraft(
            window.sessionStorage,
            { title: 'Saved title', idea: 'A saved idea', platform: 'tiktok', tone: 'viral' },
            2
        );

        render(<NewProjectWizard />);

        expect(await screen.findByText(/draft restored from/i)).toBeTruthy();
        // The draft was saved on step 2, so step 1 is one Back away.
        await screen.findByText('Platform');
        fireEvent.click(screen.getByRole('button', { name: /^Back$/i }));
        await waitFor(() =>
            expect((screen.getByLabelText('Project title') as HTMLInputElement).value).toBe(
                'Saved title'
            )
        );
    });

    it('pre-selects the preferred platform, seeds the idea from interests, then opens the project', async () => {
        mocks.onboarding.data = {
            preferredPlatforms: ['tiktok'],
            interests: [{ topic: 'ai-tools', weight: 0.9 }],
        };
        mocks.mutate.mockImplementation((_values: unknown, options: CreateCallbacks) => {
            options.onSuccess({ _id: 'new-project-id' });
        });

        render(<NewProjectWizard />);

        await waitFor(() =>
            expect((screen.getByLabelText('The idea') as HTMLTextAreaElement).value).toContain(
                'content about ai tools'
            )
        );

        fireEvent.change(screen.getByLabelText('Project title'), {
            target: { value: 'Prefilled project' },
        });
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));

        const tiktok = await screen.findByRole('radio', { name: /tiktok/i });
        expect(tiktok.getAttribute('aria-checked')).toBe('true');

        fireEvent.click(screen.getByRole('button', { name: /continue/i }));
        fireEvent.click(await screen.findByRole('button', { name: /^Create/ }));

        await waitFor(() =>
            expect(mocks.replace).toHaveBeenCalledWith('/projects/new-project-id')
        );
        expect(window.sessionStorage.length).toBe(0);
    });

    it('returns to the list when opened from the command palette', async () => {
        mocks.mutate.mockImplementation((_values: unknown, options: CreateCallbacks) => {
            options.onSuccess({ _id: 'from-palette' });
        });

        render(<NewProjectWizard returnTo="projects" />);
        await goToReview();
        fireEvent.click(screen.getByRole('button', { name: /^Create/ }));

        await waitFor(() =>
            expect(mocks.replace).toHaveBeenCalledWith('/projects?created=from-palette')
        );
    });
});
