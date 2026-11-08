import apiClient from '@/services/api-client';
import {
    TrendFeed,
    TrendReport,
    TrendScope,
    TrendWindow,
    ForMeTrendFeed,
} from '../types';
import { ApiResponse } from '@/types';

class TrendsService {
    private readonly baseUrl = '/trends/reports';
    private readonly feedUrl = '/trends';

    /**
     * Public and CDN-cacheable, so this is a plain GET with no auth attached. The
     * server sends `s-maxage=300, stale-while-revalidate=3600`.
     */
    async getGlobalFeed(
        scope: TrendScope = 'global',
        window: TrendWindow = 7,
        category?: string
    ): Promise<TrendFeed> {
        const response = await apiClient.get<ApiResponse<TrendFeed>>(`${this.feedUrl}/global`, {
            params: { scope, window, category: category ?? undefined },
        });
        return response.data.data;
    }

    /**
     * Personalised, so the server sends `private, no-store` and the ranking must
     * not be kept in a shared cache. `summary` opts into a billable model call.
     */
    async getForMeFeed(
        window: TrendWindow = 7,
        summary = false,
        category?: string
    ): Promise<ForMeTrendFeed> {
        const response = await apiClient.get<ApiResponse<ForMeTrendFeed>>(
            `${this.feedUrl}/for-me`,
            { params: { window, summary: summary ? '1' : undefined, category: category ?? undefined } }
        );
        return response.data.data;
    }

    async getReports(platform?: string): Promise<TrendReport[]> {
        const response = await apiClient.get<ApiResponse<TrendReport[]>>(this.baseUrl, {
            params: { platform }
        });
        return response.data.data;
    }

    async generateInitial(platform: string): Promise<TrendReport> {
        const response = await apiClient.post<ApiResponse<TrendReport>>(`${this.baseUrl}/generate`, { platform });
        return response.data.data;
    }

    async getReportById(id: string): Promise<TrendReport> {
        const response = await apiClient.get<ApiResponse<TrendReport>>(`${this.baseUrl}/${id}`);
        return response.data.data;
    }

    async deleteReport(id: string): Promise<void> {
        await apiClient.delete(`${this.baseUrl}/${id}`);
    }
}

export const trendsService = new TrendsService();
