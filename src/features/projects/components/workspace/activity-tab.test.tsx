// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { ActivityTab } from './activity-tab';
import type { ProjectActivityItem } from '../../types';

const activity = vi.hoisted(() => ({
    current: {
        data: {
            items: [] as ProjectActivityItem[],
            meta: {
                page: 1,
                limit: 20,
                total: 0,
                totalPages: 0,
                hasNextPage: false,
                hasPrevPage: false,
            },
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
    },
}));

vi.mock('../../hooks/use-collaboration', () => ({
    useProjectActivity: () => activity.current,
}));

describe('ActivityTab', () => {
    afterEach(cleanup);

    it('has a dedicated empty state before anything has happened', () => {
        render(<ActivityTab projectId="p1" />);

        expect(screen.getByText('No activity yet')).toBeTruthy();
        expect(screen.getByText(/invites, member changes and generations/i)).toBeTruthy();
    });

    it('renders an activity entry with the actor and target', () => {
        activity.current = {
            ...activity.current,
            data: {
                items: [
                    {
                        id: 'a1',
                        type: 'member_added',
                        target: 'Grace Hopper',
                        role: 'editor',
                        createdAt: new Date().toISOString(),
                        actor: {
                            id: 'u1',
                            firstName: 'Ada',
                            lastName: 'Lovelace',
                            email: 'ada@example.com',
                            avatar: null,
                        },
                    },
                ],
                meta: {
                    page: 1,
                    limit: 20,
                    total: 1,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPrevPage: false,
                },
            },
        };

        render(<ActivityTab projectId="p1" />);

        expect(screen.getByRole('list', { name: /project activity/i })).toBeTruthy();
        expect(screen.getByText(/added a member/i)).toBeTruthy();
        expect(screen.getByText('Grace Hopper')).toBeTruthy();
        expect(screen.getByText(/Ada Lovelace/i)).toBeTruthy();
    });
});
