// @vitest-environment jsdom
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

import type { DashboardStats } from '../services/dashboard.service';
import type { Project } from '@/types';
import { DashboardView } from './dashboard-view';

const mocks = vi.hoisted(() => ({
    stats: {
        data: undefined as DashboardStats | undefined,
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
    },
    projects: {
        data: undefined as { data: Project[]; meta: unknown } | undefined,
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
    },
    preferences: {
        data: undefined as
            | {
                  hiddenWidgets: string[];
                  interests: string[];
                  preferredPlatforms: string[];
              }
            | undefined,
        isError: false,
    },
    mutate: vi.fn(),
    trends: {
        data: { topics: [] as Array<Record<string, unknown>> },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
    },
    activity: {
        data: [] as Array<Record<string, unknown>>,
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
    },
    health: {
        data: { status: 'ready', checks: { database: 'connected' } },
        isPending: false,
        isError: false,
        refetch: vi.fn(),
    },
}));

vi.mock('next/dynamic', () => ({
    default: () => () => null,
}));

vi.mock('@/store/auth-store', () => ({
    useAuthStore: (selector: (state: { user: { plan: string } }) => unknown) =>
        selector({ user: { plan: 'starter' } }),
}));

vi.mock('../hooks/use-dashboard', () => ({
    useDashboardStats: () => mocks.stats,
    useDashboardPreferences: () => mocks.preferences,
    useUpdateDashboardPreferences: () => ({ mutate: mocks.mutate, isPending: false }),
    useRecentActivity: () => mocks.activity,
    useHealthReady: () => mocks.health,
}));

vi.mock('@/features/projects/hooks/use-projects', () => ({
    useProjects: () => mocks.projects,
}));

vi.mock('@/features/trends/hooks/use-trends', () => ({
    useForMeTrendFeed: () => mocks.trends,
}));

const STATS: DashboardStats = {
    overview: {
        totalProjects: 3,
        activeProjects: 1,
        completedProjects: 1,
        draftProjects: 1,
        archivedProjects: 0,
        totalScripts: 7,
        totalThumbnails: 2,
        totalAudioSuggestions: 0,
        totalMediaItems: 4,
    },
    projectsByPlatform: { youtube: 1, tiktok: 2, instagram: 0 },
    recentProjects: [],
    upcomingEvents: [],
    trendVelocity: [],
    weeklyActivity: [],
};

const project = (id: string, title: string, status: Project['status']): Project => ({
    _id: id,
    title,
    idea: 'idea',
    platform: 'tiktok',
    tone: 'casual',
    status,
    userId: 'u1',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-20T10:00:00.000Z',
});

const PROJECTS = {
    data: [project('p1', 'Draft project', 'draft'), project('p2', 'Finished project', 'completed')],
    meta: {},
};

function setDefaults() {
    mocks.stats.data = STATS;
    mocks.stats.isLoading = false;
    mocks.stats.isError = false;
    mocks.projects.data = PROJECTS;
    mocks.projects.isLoading = false;
    mocks.projects.isError = false;
    mocks.preferences.data = { hiddenWidgets: [], interests: [], preferredPlatforms: [] };
    mocks.preferences.isError = false;
    mocks.trends.data = { topics: [] };
    mocks.trends.isLoading = false;
    mocks.trends.isError = false;
}

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('DashboardView', () => {
    it('renders live metric numbers and projects', () => {
        setDefaults();
        render(<DashboardView />);

        expect(screen.getByText('7')).toBeTruthy();
        expect(screen.getAllByText('Draft project').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Finished project').length).toBeGreaterThan(0);
        expect(screen.queryByText(/All Systems Operational/i)).toBeNull();
    });

    it('filters projects by status with counts', () => {
        setDefaults();
        render(<DashboardView />);

        const completed = screen.getByRole('button', { name: /^Completed/ });
        fireEvent.click(completed);

        const list = screen.getByRole('list', { name: 'Projects' });
        expect(within(list).getByText('Finished project')).toBeTruthy();
        expect(within(list).queryByText('Draft project')).toBeNull();
    });

    it('shows the create-first-project empty state when there are no projects', () => {
        setDefaults();
        mocks.projects.data = { data: [], meta: {} };
        render(<DashboardView />);

        expect(screen.getAllByText('Create your first project').length).toBeGreaterThan(0);
    });

    it('keeps the rest of the page when stats fail', () => {
        setDefaults();
        mocks.stats.isError = true;
        render(<DashboardView />);

        expect(screen.getByText(/key metrics could not be loaded/i)).toBeTruthy();
        expect(screen.getAllByText('Draft project').length).toBeGreaterThan(0);
    });

    it('honours hidden widgets from the saved layout', () => {
        setDefaults();
        mocks.preferences.data = {
            hiddenWidgets: ['activity', 'health'],
            interests: [],
            preferredPlatforms: [],
        };
        render(<DashboardView />);

        expect(screen.queryByRole('heading', { name: 'Recent activity' })).toBeNull();
        expect(screen.queryByRole('heading', { name: 'System status' })).toBeNull();
        expect(screen.getByRole('heading', { name: 'Trending for you' })).toBeTruthy();
    });

    it('orders trending above generic summaries for a short-form creator', () => {
        setDefaults();
        mocks.preferences.data = {
            hiddenWidgets: [],
            interests: ['ai-tools'],
            preferredPlatforms: ['tiktok'],
        };
        render(<DashboardView />);

        const headings = screen.getAllByRole('heading').map((node) => node.textContent);
        expect(headings.indexOf('Trending for you')).toBeLessThan(
            headings.indexOf('Platform split')
        );
    });

    it('shows a locked analytics widget with the reason and upgrade link', () => {
        setDefaults();
        render(<DashboardView />);

        expect(screen.getByText(/Creation analytics is available on Pro/i)).toBeTruthy();
        expect(screen.getByRole('link', { name: /See plans/i }).getAttribute('href')).toBe(
            '/settings/billing'
        );
    });
});
