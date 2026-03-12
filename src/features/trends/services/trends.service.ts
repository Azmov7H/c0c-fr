import apiClient from '@/services/api-client';
import { TrendReport, CreateTrendDTO } from '../types';
import { ApiResponse } from '@/types';

class TrendsService {
    private readonly baseUrl = '/trends';

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
