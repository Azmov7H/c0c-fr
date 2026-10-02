import apiClient from '@/services/api-client';
import type { Project, Platform, ProjectStatus } from '@/types';
import type { PlannerEvent } from '@/features/planner/services/planner.service';

export interface DashboardStats {
    overview: {
        totalProjects: number;
        activeProjects: number;
        completedProjects: number;
        draftProjects: number;
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

export const dashboardService = {
    async getStats(): Promise<DashboardStats> {
        const { data } = await apiClient.get('/dashboard/stats');
        return data.data;
    },

    async getRecentActivity(limit = 10): Promise<RecentActivityItem[]> {
        const { data } = await apiClient.get('/dashboard/recent-activity', {
            params: { limit },
        });
        return data.data;
    },
};
