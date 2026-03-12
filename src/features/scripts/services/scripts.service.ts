import apiClient from '@/services/api-client';
import { Script, CreateScriptDTO, UpdateScriptDTO } from '../types';
import { ApiResponse } from '@/types';

class ScriptsService {
    private readonly baseUrl = '/scripts';

    async createScript(data: CreateScriptDTO): Promise<Script> {
        const response = await apiClient.post<ApiResponse<Script>>(this.baseUrl, data);
        return response.data.data;
    }

    async generateScript(projectId: string): Promise<Script> {
        const response = await apiClient.post<ApiResponse<Script>>(`${this.baseUrl}/generate`, { projectId });
        return response.data.data;
    }

    async getProjectScripts(projectId: string): Promise<Script[]> {
        const response = await apiClient.get<ApiResponse<Script[]>>(`${this.baseUrl}/project/${projectId}`);
        return response.data.data;
    }

    async getScriptById(id: string): Promise<Script> {
        const response = await apiClient.get<ApiResponse<Script>>(`${this.baseUrl}/${id}`);
        return response.data.data;
    }

    async updateScript(id: string, data: UpdateScriptDTO): Promise<Script> {
        const response = await apiClient.patch<ApiResponse<Script>>(`${this.baseUrl}/${id}`, data);
        return response.data.data;
    }

    async deleteScript(id: string): Promise<void> {
        await apiClient.delete(`${this.baseUrl}/${id}`);
    }
}

export const scriptsService = new ScriptsService();
