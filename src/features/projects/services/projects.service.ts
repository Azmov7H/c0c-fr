import apiClient from '@/services/api-client';
import { Project, PaginatedResponse, ApiResponse } from '@/types';

export interface CreateProjectDTO {
    title: string;
    description?: string;
    idea: string;
    platform: 'youtube' | 'tiktok' | 'instagram';
    tone: 'educational' | 'dramatic' | 'viral' | 'storytelling' | 'casual' | 'professional';
}

export interface UpdateProjectDTO extends Partial<CreateProjectDTO> {
    status?: 'draft' | 'processing' | 'completed' | 'archived';
}

export interface ProjectsQuery {
    page?: number;
    limit?: number;
    status?: string;
    platform?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
}

export const projectsService = {
    create: async (data: CreateProjectDTO): Promise<Project> => {
        const response = await apiClient.post<ApiResponse<Project>>('/projects', data);
        return response.data.data;
    },

    getAll: async (params?: ProjectsQuery): Promise<PaginatedResponse<Project>> => {
        const response = await apiClient.get<PaginatedResponse<Project>>('/projects', { params });
        return response.data;
    },

    getById: async (id: string): Promise<Project> => {
        const response = await apiClient.get<ApiResponse<Project>>(`/projects/${id}`);
        return response.data.data;
    },

    update: async (id: string, data: UpdateProjectDTO): Promise<Project> => {
        const response = await apiClient.patch<ApiResponse<Project>>(`/projects/${id}`, data);
        return response.data.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/projects/${id}`);
    },
};
