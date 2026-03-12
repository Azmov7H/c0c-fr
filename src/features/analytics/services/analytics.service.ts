import apiClient from '@/services/api-client';
import { AnalyticsReport, CreateAnalyticsDTO, UpdateAnalyticsDTO } from '../types';
import { ApiResponse } from '@/types';

class AnalyticsService {
    private readonly baseUrl = '/analytics';

    async createReport(data: CreateAnalyticsDTO): Promise<AnalyticsReport> {
        const response = await apiClient.post<ApiResponse<AnalyticsReport>>(this.baseUrl, data);
        return response.data.data;
    }

    async generateInitial(projectId: string): Promise<AnalyticsReport> {
        const response = await apiClient.post<ApiResponse<AnalyticsReport>>(`${this.baseUrl}/generate`, { projectId });
        return response.data.data;
    }

    async getProjectReports(projectId: string, period?: string): Promise<AnalyticsReport[]> {
        const response = await apiClient.get<ApiResponse<AnalyticsReport[]>>(`${this.baseUrl}/project/${projectId}`, {
            params: { period }
        });
        return response.data.data;
    }

    async getReportById(id: string): Promise<AnalyticsReport> {
        const response = await apiClient.get<ApiResponse<AnalyticsReport>>(`${this.baseUrl}/${id}`);
        return response.data.data;
    }

    async updateReport(id: string, data: UpdateAnalyticsDTO): Promise<AnalyticsReport> {
        const response = await apiClient.patch<ApiResponse<AnalyticsReport>>(`${this.baseUrl}/${id}`, data);
        return response.data.data;
    }

    async deleteReport(id: string): Promise<void> {
        await apiClient.delete(`${this.baseUrl}/${id}`);
    }
}

export const analyticsService = new AnalyticsService();
