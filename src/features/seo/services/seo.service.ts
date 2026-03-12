import apiClient from '@/services/api-client';
import { SEOAnalysis, CreateSEODTO, UpdateSEODTO } from '../types';
import { ApiResponse } from '@/types';

class SEOService {
    private readonly baseUrl = '/seo';

    async getAnalysisByProject(projectId: string): Promise<SEOAnalysis | null> {
        const response = await apiClient.get<ApiResponse<SEOAnalysis>>(`${this.baseUrl}/project/${projectId}`);
        return response.data.data;
    }

    async generateInitial(projectId: string): Promise<SEOAnalysis> {
        const response = await apiClient.post<ApiResponse<SEOAnalysis>>(`${this.baseUrl}/generate`, { projectId });
        return response.data.data;
    }

    async updateAnalysis(id: string, data: UpdateSEODTO): Promise<SEOAnalysis> {
        const response = await apiClient.patch<ApiResponse<SEOAnalysis>>(`${this.baseUrl}/${id}`, data);
        return response.data.data;
    }
}

export const seoService = new SEOService();
