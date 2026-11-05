// @vitest-environment jsdom
/**
 * T21 — the lazy dashboard widget module (T20) had zero tests: seven widgets
 * fed by four hooks, the biggest feature-coverage gap the T20 split produced.
 * The hooks are mocked at their boundary (same approach dashboard-view.test
 * uses) so each widget's render states — loading, error, empty, populated —
 * are exercised against the real rendering code.
 */
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import type { DashboardStats, RecentActivityItem } from '../services/dashboard.service';
import type { PlannerEvent } from '../../planner/services/planner.service';
import { DashboardWidget } from './dashboard-widgets';

const mocks = vi.hoisted(() => ({
    stats: {
        data: undefined as DashboardStats | undefined,
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
    },
    preferences: {
        data: undefined as
            | { hiddenWidgets: string[]; interests: string[]; preferredPlatforms: string[] }
            | undefined,
        isError: false,
    },
    activity: {
        data: [] as RecentActivityItem[],
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
    },
    health: {
        data: undefined as { status: string; checks: { database: string } } | undefined,
        isPending: false,
        isError: false,
        refetch: vi.fn(),
    },
    trends: {
        data: undefined as
            | { topics: Array<{ topic: string; platforms: string[]; matchedPlatforms: string[]; viralScore: number }> }
            | undefined,
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
    },
}));

vi.mock('../hooks/use-dashboard', () => ({
    useDashboardStats: () => mocks.stats,
    useDashboardPreferences: () => mocks.preferences,
    useRecentActivity: () => mocks.activity,
    useHealthReady: () => mocks.health,
}));

vi.mock('@/features/trends/hooks/use-trends', () => ({
    useForMeTrendFeed: () => mocks.trends,
}));

// Widgets render next/link deep below the app router; a plain anchor keeps the
// unit boundary honest without standing up a router for each widget.
vi.mock('next/link', () => ({
    default: (props: { href: string; className?: string; children?: React.ReactNode }) =>
        React.createElement('a', { href: props.href, className: props.className }, props.children),
}));

function readyStats(): DashboardStats {
    return {
        overview: {
            totalProjects: 6,
            activeProjects: 2,
            completedProjects: 3,
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
}

describe('StatusWidget', () => {
    afterEach(cleanup);

    it('shows the four status counts', () => {
        mocks.stats.data = readyStats();
        mocks.stats.isLoading = false;
        mocks.stats.isError = false;

        render(<DashboardWidget id="status" />);

        expect(screen.getByText('Draft')).toBeTruthy();
        expect(screen.getByText('1')).toBeTruthy();
        expect(screen.getByText('In progress')).toBeTruthy();
        expect(screen.getByText('2')).toBeTruthy();
        expect(screen.getByText('Completed')).toBeTruthy();
        expect(screen.getByText('3')).toBeTruthy();
        expect(screen.getByText('Archived')).toBeTruthy();
    });

    it('loading falls back to the skeleton strip', () => {
        mocks.stats.isLoading = true;
        const { container } = render(<DashboardWidget id="status" />);

        expect(container.querySelector('[data-state="loading"]')).toBeTruthy();
    });

    it('an error names the query and keeps the retry', () => {
        mocks.stats.isLoading = false;
        mocks.stats.isError = true;

        render(<DashboardWidget id="status" />);

        expect(screen.getByText(/project status could not be loaded/i)).toBeTruthy();
        expect(screen.getByRole('button')).toBeTruthy(); // DataState's retry affordance
    });

    it('undefined stats read as zeros — the share math never divides by NaN', () => {
        mocks.stats.data = undefined;
        mocks.stats.isLoading = false;
        mocks.stats.isError = false;

        render(<DashboardWidget id="status" />);

        expect(screen.getAllByText('0')).toHaveLength(4);
    });
});

describe('PlatformsWidget', () => {
    afterEach(cleanup);

    it('renders each platform with its count and share in the preferred order', () => {
        mocks.stats.data = readyStats();
        mocks.stats.isLoading = false;
        mocks.stats.isError = false;
        mocks.preferences.data = { hiddenWidgets: [], interests: [], preferredPlatforms: [] };

        render(<DashboardWidget id="platforms" />);

        // youtube 1/3 · tiktok 2/3 · instagram 0/3
        expect(screen.getByText('1 · 33%')).toBeTruthy();
        expect(screen.getByText('2 · 67%')).toBeTruthy();
        expect(screen.getByText('0 · 0%')).toBeTruthy();
        expect(screen.getByText('YouTube')).toBeTruthy();
        expect(screen.getByText('TikTok')).toBeTruthy();
    });

    it('no projects at all renders the empty state instead of zero-rows', () => {
        mocks.stats.data = undefined;
        mocks.stats.isLoading = false;
        mocks.stats.isError = false;
        mocks.preferences.data = { hiddenWidgets: [], interests: [], preferredPlatforms: [] };

        render(<DashboardWidget id="platforms" />);

        expect(screen.queryByText('0 · 0%')).toBeNull();
        expect(screen.getByText(/no projects by platform yet/i)).toBeTruthy();
    });

    it('an empty split carries the create-a-project copy', () => {
        mocks.stats.data = undefined;
        mocks.stats.isLoading = false;
        mocks.stats.isError = false;
        mocks.preferences.data = { hiddenWidgets: [], interests: [], preferredPlatforms: [] };

        render(<DashboardWidget id="platforms" />);

        expect(screen.getByText(/no projects by platform yet/i)).toBeTruthy();
        expect(screen.getByText(/create a project and it will appear/i)).toBeTruthy();
    });
});

describe('TrendingWidget', () => {
    afterEach(cleanup);

    it('lists feed topics with matched platforms and the viral score', () => {
        mocks.trends.data = {
            topics: [
                {
                    topic: 'Faceless finance',
                    platforms: ['youtube', 'tiktok'],
                    matchedPlatforms: ['youtube'],
                    viralScore: 87.4,
                },
            ],
        };
        mocks.trends.isLoading = false;
        mocks.trends.isError = false;

        render(<DashboardWidget id="trending" />);

        expect(screen.getByText('Faceless finance')).toBeTruthy();
        expect(screen.getByText('youtube')).toBeTruthy(); // matched list wins over raw platforms
        expect(screen.getByText(/87\.4 score/i)).toBeTruthy();
        expect(screen.getByText(/explore trends/i)).toBeTruthy(); // the Link foots the list
    });

    it('mismatch interests fall back to the raw platform list on the summary line', () => {
        mocks.trends.data = {
            topics: [
                {
                    topic: 'Silent vlogs',
                    platforms: ['instagram'],
                    matchedPlatforms: [],
                    viralScore: 12,
                },
            ],
        };

        render(<DashboardWidget id="trending" />);

        expect(screen.getByText('instagram')).toBeTruthy();
    });

    it('an empty feed explains the interests contract behind it', () => {
        mocks.trends.data = { topics: [] };
        mocks.trends.isLoading = false;
        mocks.trends.isError = false;

        render(<DashboardWidget id="trending" />);

        expect(screen.getByText(/no trends measured for you yet/i)).toBeTruthy();
        expect(screen.getByText(/pick interests in onboarding/i)).toBeTruthy();
    });

    it('the empty-state action points the visitor at the interests editor', () => {
        mocks.trends.data = { topics: [] };

        render(<DashboardWidget id="trending" />);

        // jsdom permits the window.location.href assignment but cannot perform
        // the navigation ("Not implemented") — so the gut check is that the
        // wired action is clickable and the click does not crash the widget.
        fireEvent.click(screen.getByRole('button', { name: /update your interests/i }));
    });
});

describe('ActivityWidget', () => {
    afterEach(cleanup);

    it('renders the feed with titles, the type/time line and a status badge', () => {
        mocks.activity.data = [
            {
                id: 'a1',
                type: 'project',
                title: 'Zen garden promo',
                status: 'completed',
                createdAt: '2026-10-30T12:00:00.000Z',
            },
            {
                id: 'a2',
                type: 'script',
                title: 'Hook rewrites',
                status: '',
                createdAt: '2026-10-30T13:00:00.000Z',
            },
        ];

        render(<DashboardWidget id="activity" />);

        expect(screen.getByText('Zen garden promo')).toBeTruthy();
        expect(screen.getByText(/project/i)).toBeTruthy();
        expect(screen.getByText('completed')).toBeTruthy();
        expect(screen.getByText('new')).toBeTruthy(); // empty-status script falls back to "new"
        expect(screen.getByText(/script/i)).toBeTruthy();
    });

    it('an empty feed carries its own empty-state copy', () => {
        mocks.activity.data = [];
        mocks.activity.isLoading = false;
        mocks.activity.isError = false;

        render(<DashboardWidget id="activity" />);

        expect(screen.getByText(/no activity yet/i)).toBeTruthy();
        expect(screen.getByText(/generate a script or create a project/i)).toBeTruthy();
    });
});

describe('UpcomingWidget', () => {
    afterEach(cleanup);

    it('schedules render with a date block and a platform tag', () => {
        const event: PlannerEvent = {
            _id: 'e1',
            userId: 'u1',
            type: 'publish',
            title: 'November launch',
            status: 'pending',
            scheduledDate: '2026-11-05T09:00:00.000Z',
            platform: 'youtube',
            createdAt: '2026-10-01T00:00:00.000Z',
            updatedAt: '2026-10-01T00:00:00.000Z',
        };
        mocks.stats.data = { ...readyStats(), upcomingEvents: [event] };
        mocks.stats.isLoading = false;
        mocks.stats.isError = false;

        render(<DashboardWidget id="upcoming" />);

        expect(screen.getByText('November launch')).toBeTruthy();
        expect(screen.getByText('Nov')).toBeTruthy(); // en-US short month block
        expect(screen.getByText('5')).toBeTruthy(); // day block
        expect(screen.getByText('youtube')).toBeTruthy(); // platform badge
    });

    it('events without a platform skip the badge and an empty schedule explains itself', () => {
        const event: PlannerEvent = {
            _id: 'e2',
            userId: 'u1',
            type: 'schedule',
            title: 'Evergreen clip',
            status: 'completed',
            scheduledDate: '2026-11-09T09:00:00.000Z',
            platform: undefined,
            createdAt: '2026-10-01T00:00:00.000Z',
            updatedAt: '2026-10-01T00:00:00.000Z',
        };
        mocks.stats.data = { ...readyStats(), upcomingEvents: [event] };

        const { container } = render(<DashboardWidget id="upcoming" />);
        expect(screen.getByText('Evergreen clip')).toBeTruthy();
        expect(container.querySelector('[data-slot="badge"]')).toBeNull();

        cleanup();
        mocks.stats.data = { ...readyStats(), upcomingEvents: [] };
        render(<DashboardWidget id="upcoming" />);
        expect(screen.getByText(/plan a publish date/i)).toBeTruthy();
    });
});

describe('QuickActionsWidget', () => {
    afterEach(cleanup);

    it('exposes the four static links', () => {
        render(<DashboardWidget id="quickActions" />);

        expect(screen.getByText('Generate Script')).toBeTruthy();
        expect(screen.getByText('Explore Trends')).toBeTruthy();
        expect(screen.getByText('New Project')).toBeTruthy();
        expect(screen.getByText('Team')).toBeTruthy();
    });
});

describe('HealthWidget', () => {
    afterEach(cleanup);

    it('pending shows the two-skeleton strip', () => {
        mocks.health.isPending = true;
        const { container } = render(<DashboardWidget id="health" />);

        expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThanOrEqual(2);
    });

    it('ready reports the connected database check', () => {
        mocks.health.isPending = false;
        mocks.health.isError = false;
        mocks.health.data = { status: 'ready', checks: { database: 'connected' } };

        render(<DashboardWidget id="health" />);

        expect(screen.getByText(/API ready — database connected/i)).toBeTruthy();
    });

    it('an unreachable API is a degraded chip with a working retry', () => {
        mocks.health.isError = true;
        mocks.health.isPending = false;
        mocks.health.data = undefined;
        mocks.health.refetch.mockClear();

        render(<DashboardWidget id="health" />);

        expect(screen.getByText(/status unavailable/i)).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: /retry/i }));
        expect(mocks.health.refetch).toHaveBeenCalledTimes(1);
    });

    it('a flash-degraded backend names the failing check without offering retry', () => {
        mocks.health.isError = false;
        mocks.health.isPending = false;
        mocks.health.data = { status: 'degraded', checks: { database: 'degraded' } };

        render(<DashboardWidget id="health" />);

        expect(screen.getByText(/degraded — database degraded/i)).toBeTruthy();
        expect(screen.queryByRole('button')).toBeNull();
    });
});
