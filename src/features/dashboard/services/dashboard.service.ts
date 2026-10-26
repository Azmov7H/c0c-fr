import apiClient from '@/services/api-client';
import type { Project, Platform, ProjectStatus } from '@/types';
import type { PlannerEvent } from '@/features/planner/services/planner.service';
import type { DashboardPreferences } from '../lib/widget-layout';

export interface DashboardStats {
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
    projectsByPlatform: { youtube: number; tiktok: number; instagram: number };
    recentProjects: Project[];
    upcomingEvents: PlannerEvent[];
    trendVelocity: { date: string; count: number }[];
    weeklyActivity: { day: string; projects: number; scripts: number }[];
}

export interface RecentActivityItem {
    id: string;
    type: 'project' | 'script';
    title: string;
    platform?: Platform;
    status: ProjectStatus | string;
    createdAt: string;
}

export interface HealthReady {
    status: 'ready' | 'degraded';
    checks: {
        database: string;
    };
}

export const dashboardService = {
    async getStats(): Promise<DashboardStats> {
        const { data } = await apiClient.get<{ data: DashboardStats }>('/dashboard/stats');
        return data.data;
    },

    async getRecentActivity(limit = 10): Promise<RecentActivityItem[]> {
        const { data } = await apiClient.get<{ data: RecentActivityItem[] }>('/dashboard/recent-activity', {
            params: { limit },
        });
        return data.data;
    },

    /**
     * Public endpoint — it reports dependency state, never internals.
     * `checks.database` is the mongoose connection state name (`connected`,
     * `connecting`, `disconnected`, …).
     */
    async getHealthReady(): Promise<HealthReady> {
        const { data } = await apiClient.get<{ data: HealthReady }>('/health/ready');
        return data.data;
    },

    /**
     * Per-user dashboard layout (T14). Also carries the onboarding context the
     * server uses to order widgets, so the first paint is already personalised.
     */
    async getPreferences(): Promise<DashboardPreferences> {
        const { data } = await apiClient.get<{ data: DashboardPreferences }>('/users/profile/preferences');
        return data.data;
    },

    async updatePreferences(
        hiddenWidgets: DashboardPreferences['hiddenWidgets']
    ): Promise<DashboardPreferences> {
        const { data } = await apiClient.patch<{ data: DashboardPreferences }>('/users/profile/preferences', { hiddenWidgets });
        return data.data;
    },
};
