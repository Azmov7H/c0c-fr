// @vitest-environment jsdom
/**
 * AR-027 — the dashboard speaks Arabic.
 *
 * The copy test proves the catalogs are complete; this one proves the
 * COMPONENTS read them. It mounts the real client components inside an
 * Arabic provider and asserts the Arabic strings render — the failure mode a
 * catalog test cannot catch is a component that kept a literal.
 */
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen } from '@testing-library/react';

import type { DashboardStats } from './services/dashboard.service';
import type { Project } from '@/types';
import { renderArabic } from './test-utils';
import { DashboardView } from './components/dashboard-view';
import { DashboardWidget } from './components/dashboard-widgets';
import { WidgetSettings } from './components/widget-settings';

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
        data: { hiddenWidgets: [] as string[], interests: [], preferredPlatforms: [] },
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
    billing: {
        data: { features: ['analytics.advanced'] as string[] },
        isLoading: false,
    },
}));

vi.mock('next/dynamic', () => ({
    default: () => () => null,
}));

vi.mock('@/store/auth-store', () => ({
    useAuthStore: (selector: (state: { user: { plan: string } }) => unknown) =>
        selector({ user: { plan: 'starter' } }),
}));

vi.mock('./hooks/use-dashboard', () => ({
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

vi.mock('@/features/billing/hooks/use-billing', () => ({
    useBillingSummary: () => mocks.billing,
}));

const STATS: DashboardStats = {
    overview: {
        totalProjects: 7,
        activeProjects: 2,
        completedProjects: 3,
        draftProjects: 2,
        archivedProjects: 0,
        totalScripts: 5,
        totalThumbnails: 1,
        totalAudioSuggestions: 0,
        totalMediaItems: 3,
    },
    projectsByPlatform: { youtube: 1, tiktok: 2, instagram: 0, facebook: 0 },
    recentProjects: [],
    upcomingEvents: [],
    trendVelocity: [],
    weeklyActivity: [],
};

function project(id: string, title: string): Project {
    return {
        _id: id,
        title,
        idea: 'idea',
        platform: 'tiktok',
        tone: 'casual',
        status: 'draft',
        userId: 'u1',
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-20T10:00:00.000Z',
    };
}

function ready() {
    mocks.stats.data = STATS;
    mocks.projects.data = { data: [project('p1', 'عرض تجريبي')], meta: {} };
}

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('AR-027 — the dashboard in Arabic', () => {
    it('the view header, actions and project filters render in Arabic', () => {
        ready();
        renderArabic(<DashboardView />);

        expect(screen.getByRole('heading', { name: 'لوحة التحكم' })).toBeTruthy();
        expect(screen.getByRole('button', { name: /مشروع جديد/ })).toBeTruthy();
        expect(
            screen.getByRole('group', { name: 'تصفية المشاريع حسب الحالة' })
        ).toBeTruthy();
        expect(screen.getByRole('button', { name: /^مسودة/ })).toBeTruthy();
        expect(screen.getByRole('list', { name: 'المشاريع' })).toBeTruthy();
        expect(screen.queryByText('Dashboard')).toBeNull();
        expect(screen.queryByText('Customise')).toBeNull();
    });

    it('the metric labels and the status widget render in Arabic', () => {
        ready();
        renderArabic(<DashboardWidget id="status" />);

        expect(screen.getByText('مسودة')).toBeTruthy();
        expect(screen.getByText('قيد التنفيذ')).toBeTruthy();
        expect(screen.getByText('مكتمل')).toBeTruthy();
        expect(screen.getByText('مؤرشف')).toBeTruthy();
    });

    it('the quick actions and the customise dialog render in Arabic', () => {
        renderArabic(<WidgetSettings preferences={{ hiddenWidgets: [], interests: [], preferredPlatforms: [] }} pending={false} onToggle={vi.fn()} onShowAll={vi.fn()} />);

        expect(screen.getByRole('button', { name: /تخصيص/ })).toBeTruthy();

        cleanup();
        renderArabic(<DashboardWidget id="quickActions" />);
        expect(screen.getByText('توليد نص')).toBeTruthy();
        expect(screen.getByText('استكشاف الاتجاهات')).toBeTruthy();
        expect(screen.queryByText('Generate Script')).toBeNull();
    });
});
