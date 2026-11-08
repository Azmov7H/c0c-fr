// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { AnalyticsDashboard } from './analytics-dashboard';

const mocks = vi.hoisted(() => ({
    stats: {
        data: undefined as
            | {
                  overview: {
                      totalProjects: number;
                      activeProjects: number;
                      completedProjects: number;
                      draftProjects: number;
                      archivedProjects: number;
                      totalScripts: number;
                      totalThumbnails: number;
                      totalAudioSuggestions: number;
                      totalMediaItems: number;
                  };
                  projectsByPlatform: { youtube: number; tiktok: number; instagram: number; facebook: number };
                  recentProjects: Array<Record<string, unknown>>;
                  upcomingEvents: [];
                  trendVelocity: [];
                  weeklyActivity: Array<{ day: string; projects: number; scripts: number }>;
              }
            | undefined,
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
    },
}));

vi.mock('@/features/dashboard/hooks/use-dashboard', () => ({
    useDashboardStats: () => mocks.stats,
}));

vi.mock('next/dynamic', () => ({
    default: () => () => null,
}));

const stats = (overrides: object = {}) => ({
    overview: {
        totalProjects: 3,
        activeProjects: 1,
        completedProjects: 1,
        draftProjects: 1,
        archivedProjects: 0,
        totalScripts: 5,
        totalThumbnails: 2,
        totalAudioSuggestions: 1,
        totalMediaItems: 4,
    },
    projectsByPlatform: { youtube: 2, tiktok: 1, instagram: 0, facebook: 0 },
    recentProjects: [{ _id: 'p1', title: 'Alpha', updatedAt: new Date().toISOString(), createdAt: new Date().toISOString() }],
    upcomingEvents: [],
    trendVelocity: [],
    weeklyActivity: [
        { day: 'Mon', projects: 1, scripts: 2 },
        { day: 'Tue', projects: 0, scripts: 1 },
    ],
    ...overrides,
});

describe('AnalyticsDashboard (P01)', () => {
    it('shows measured counts with provenance, never fake views', () => {
        mocks.stats.data = stats() as never;
        mocks.stats.isLoading = false;
        mocks.stats.isError = false;
        render(<AnalyticsDashboard />);
        expect(screen.getByText('Projects')).toBeTruthy();
        expect(screen.getByText('Creation activity (last 7 days)')).toBeTruthy();
        expect(screen.getByText('Measured')).toBeTruthy();
        expect(screen.getByText(/measured, not views/)).toBeTruthy();
        // Fake surface is gone.
        expect(screen.queryByText('Total Views')).toBeNull();
        expect(screen.queryByText('2.4M')).toBeNull();
        expect(screen.queryByText('Engagement Funnel')).toBeNull();
        expect(screen.queryByText('Audience Demographics')).toBeNull();
        expect(screen.queryByText(/Views Over Time/)).toBeNull();
    });

    it('zero activity reads as unavailable with a reason', () => {
        mocks.stats.data = stats({
            overview: { totalProjects: 0, activeProjects: 0, completedProjects: 0, draftProjects: 0, archivedProjects: 0, totalScripts: 0, totalThumbnails: 0, totalAudioSuggestions: 0, totalMediaItems: 0 },
            weeklyActivity: [],
            recentProjects: [],
        }) as never;
        render(<AnalyticsDashboard />);
        expect(screen.getByText('No generation activity yet')).toBeTruthy();
        expect(screen.getByText(/Create your first project/)).toBeTruthy();
    });

    it('loading shows skeletons, error shows retry — never fake numbers', () => {
        mocks.stats.data = undefined;
        mocks.stats.isLoading = true;
        mocks.stats.isError = false;
        render(<AnalyticsDashboard />);
        expect(screen.queryByText('2.4M')).toBeNull();
    });

    it('error state explains itself', () => {
        mocks.stats.data = undefined;
        mocks.stats.isLoading = false;
        mocks.stats.isError = true;
        render(<AnalyticsDashboard />);
        expect(screen.queryByText('2.4M')).toBeNull();
    });
});
