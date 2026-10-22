// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { InviteLanding } from './invite-landing';
import { projectInvitesService } from '../services/collaboration.service';

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/store/auth-store', () => ({
    useAuthStore: (selector: (state: { isAuthenticated: boolean }) => unknown) =>
        selector({ isAuthenticated: true }),
}));

vi.mock('../services/collaboration.service', () => ({
    projectInvitesService: {
        preview: vi.fn(),
        accept: vi.fn(),
    },
}));

const preview = vi.mocked(projectInvitesService.preview);
const accept = vi.mocked(projectInvitesService.accept);

const renderLanding = () => {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return render(
        <QueryClientProvider client={client}>
            <InviteLanding token="tok_test" />
        </QueryClientProvider>
    );
};

describe('InviteLanding', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('shows identical copy for expired, revoked and unknown invites', async () => {
        const failures = [
            { status: 404, code: 'INVITE_EXPIRED', message: 'Invite expired' },
            { status: 404, code: 'INVITE_REVOKED', message: 'Invite revoked' },
            { status: 404, code: 'NOT_FOUND', message: 'No invite with that token' },
        ];
        const seen: string[] = [];

        for (const failure of failures) {
            preview.mockRejectedValueOnce(failure);
            renderLanding();
            await screen.findByText('Invite unavailable');
            seen.push(document.body.textContent ?? '');
            cleanup();
        }

        expect(new Set(seen).size).toBe(1);
        expect(seen[0]).toContain(
            'This invite link is not valid. It may have expired, been revoked, or already used.'
        );
        expect(seen[0]?.toLowerCase()).not.toContain(failureMessage());
    });

    it('treats an already-member accept as a friendly state instead of an error', async () => {
        preview.mockResolvedValue({
            projectName: 'Launch Plan',
            inviterName: 'Ada',
            role: 'editor',
            expiresIn: 86_400,
        });
        accept.mockRejectedValueOnce({ status: 409, code: 'ALREADY_MEMBER' });

        renderLanding();
        fireEvent.click(await screen.findByRole('button', { name: /accept invite/i }));

        await screen.findByText('You already have access');
        expect(screen.getByText(/already a member of “Launch Plan”/)).toBeTruthy();
        expect(screen.queryByRole('alert')).toBeNull();
    });
});

function failureMessage() {
    return 'invite expired';
}
