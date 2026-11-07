import apiClient from '@/services/api-client';
import { AudioSuggestion, CreateAudioSuggestionDTO, UpdateAudioSuggestionDTO, UploadAudioDTO, ReplaceAudioDTO } from '../types';
import { ApiResponse } from '@/types';

class AudioService {
    private readonly baseUrl = '/audio';

    async createSuggestion(data: CreateAudioSuggestionDTO): Promise<AudioSuggestion> {
        const response = await apiClient.post<ApiResponse<AudioSuggestion>>(this.baseUrl, data);
        return response.data.data;
    }

    async generateAudio(projectId: string, scriptId?: string): Promise<AudioSuggestion> {
        const response = await apiClient.post<ApiResponse<AudioSuggestion>>(`${this.baseUrl}/generate`, { projectId, scriptId });
        return response.data.data;
    }

    async getProjectSuggestions(projectId: string): Promise<AudioSuggestion[]> {
        const response = await apiClient.get<ApiResponse<AudioSuggestion[]>>(`${this.baseUrl}/project/${projectId}`);
        return response.data.data;
    }

    async getSuggestionById(id: string): Promise<AudioSuggestion> {
        const response = await apiClient.get<ApiResponse<AudioSuggestion>>(`${this.baseUrl}/${id}`);
        return response.data.data;
    }

    async updateSuggestion(id: string, data: UpdateAudioSuggestionDTO): Promise<AudioSuggestion> {
        const response = await apiClient.patch<ApiResponse<AudioSuggestion>>(`${this.baseUrl}/${id}`, data);
        return response.data.data;
    }

    async deleteSuggestion(id: string): Promise<void> {
        await apiClient.delete(`${this.baseUrl}/${id}`);
    }

    async uploadAudio(data: UploadAudioDTO): Promise<AudioSuggestion> {
        const response = await apiClient.post<ApiResponse<AudioSuggestion>>(`${this.baseUrl}/upload`, data);
        return response.data.data;
    }

    async replaceAudio(id: string, data: ReplaceAudioDTO): Promise<AudioSuggestion> {
        const response = await apiClient.post<ApiResponse<AudioSuggestion>>(`${this.baseUrl}/${id}/replace`, data);
        return response.data.data;
    }

    async getCurrent(projectId: string): Promise<AudioSuggestion | null> {
        const response = await apiClient.get<ApiResponse<AudioSuggestion | null>>(`${this.baseUrl}/project/${projectId}/current`);
        return response.data.data;
    }
}

export const audioService = new AudioService();
