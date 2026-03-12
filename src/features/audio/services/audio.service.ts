import apiClient from '@/services/api-client';
import { AudioSuggestion, CreateAudioSuggestionDTO, UpdateAudioSuggestionDTO } from '../types';
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
}

export const audioService = new AudioService();
