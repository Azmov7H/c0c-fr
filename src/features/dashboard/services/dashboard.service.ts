import apiClient from '@/services/api-client';

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
    recentProjects: any[];
    upcomingEvents: any[];
    trendVelocity: { date: string; count: number }[];
    weeklyActivity: { day: string; projects: number; scripts: number }[];
}

export const dashboardService = {
    async getStats(): Promise<DashboardStats> {
        const { data } = await apiClient.get('/dashboard/stats');
        return data.data;
    },

    async getRecentActivity(limit = 10): Promise<any[]> {
        const { data } = await apiClient.get('/dashboard/recent-activity', {
            params: { limit },
        });
        return data.data;
    },
};
