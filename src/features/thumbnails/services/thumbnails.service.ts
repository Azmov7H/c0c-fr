import apiClient from '@/services/api-client';
import { Thumbnail, CreateThumbnailDTO, UpdateThumbnailDTO } from '../types';
import { ApiResponse } from '@/types';

class ThumbnailsService {
    private readonly baseUrl = '/thumbnails';

    async createThumbnail(data: CreateThumbnailDTO): Promise<Thumbnail> {
        const response = await apiClient.post<ApiResponse<Thumbnail>>(this.baseUrl, data);
        return response.data.data;
    }

    async getProjectThumbnails(projectId: string): Promise<Thumbnail[]> {
        const response = await apiClient.get<ApiResponse<Thumbnail[]>>(`${this.baseUrl}/project/${projectId}`);
        return response.data.data;
    }

    async getThumbnailById(id: string): Promise<Thumbnail> {
        const response = await apiClient.get<ApiResponse<Thumbnail>>(`${this.baseUrl}/${id}`);
        return response.data.data;
    }

    async updateThumbnail(id: string, data: UpdateThumbnailDTO): Promise<Thumbnail> {
        const response = await apiClient.patch<ApiResponse<Thumbnail>>(`${this.baseUrl}/${id}`, data);
        return response.data.data;
    }

    async deleteThumbnail(id: string): Promise<void> {
        await apiClient.delete(`${this.baseUrl}/${id}`);
    }
}

export const thumbnailsService = new ThumbnailsService();
