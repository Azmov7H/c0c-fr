// @vitest-environment jsdom
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { TooltipProvider } from '@/components/ui/tooltip';
import { MembersTab } from './members-tab';

const mocks = vi.hoisted(() => ({
    members: {
        data: {
            projectId: 'p1',
            owner: {
                userId: 'u1',
                role: 'owner' as const,
                user: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', avatar: null },
            },
            members: [
                {
                    userId: 'u2',
                    role: 'editor' as const,
                    joinedAt: new Date().toISOString(),
                    user: { firstName: 'Grace', lastName: 'Hopper', email: 'grace@example.com', avatar: null },
                },
            ],
            memberLimit: 1,
            usedSlots: 1,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
    },
    invites: { data: [], isLoading: false, refetch: vi.fn() },
}));

vi.mock('@/store/auth-store', () => ({
    useAuthStore: (selector: (state: { user: { id: string } }) => unknown) =>
        selector({ user: { id: 'u1' } }),
}));

vi.mock('../../hooks/use-collaboration', () => {
    const mutation = () => ({ mutate: vi.fn(), isPending: false });
    return {
        useProjectMembers: () => mocks.members,
        useProjectInvites: () => mocks.invites,
        useUpdateMemberRole: mutation,
        useRemoveMember: mutation,
        useCreateInvite: mutation,
        useRevokeInvite: mutation,
    };
});

const renderTab = (role: 'owner' | 'editor' | 'viewer' = 'owner') =>
    render(
        <TooltipProvider>
            <MembersTab projectId="p1" role={role} />
        </TooltipProvider>
    );

describe('MembersTab', () => {
    afterEach(cleanup);

    it('disables inviting at the member limit and links to the upgrade page', () => {
        renderTab('owner');

        expect(screen.getByText('Member limit reached')).toBeTruthy();
        expect(screen.getAllByText(/1 of 1 collaborator/).length).toBeGreaterThan(0);
        expect(screen.getByRole('link', { name: /upgrade your plan/i }).getAttribute('href')).toBe(
            '/settings/billing'
        );
        expect((screen.getByRole('button', { name: /create invite/i }) as HTMLButtonElement).disabled).toBe(true);
    });

    it('states why the owner cannot be removed and offers no owner role option', () => {
        renderTab('owner');

        expect((screen.getByRole('button', { name: /owner cannot be removed/i }) as HTMLButtonElement).disabled).toBe(true);
        expect(
            screen.getByTitle(
                'Only the project owner can remove members, and the owner cannot be removed.'
            )
        ).toBeTruthy();
        // The role menu exists for the editor but there is no owner option anywhere.
        expect(screen.getByLabelText('Role for Grace Hopper')).toBeTruthy();
        expect(screen.queryByText('Owner', { selector: 'option' })).toBeNull();
    });

    it('renders a read-only roster for a viewer with stated reasons', () => {
        renderTab('viewer');

        expect(screen.getByText('Only the project owner can invite members.')).toBeTruthy();
        expect((screen.getByRole('button', { name: /cannot remove grace hopper/i }) as HTMLButtonElement).disabled).toBe(true);
        expect(screen.getByTitle('Only the project owner can remove members.')).toBeTruthy();
    });
});
