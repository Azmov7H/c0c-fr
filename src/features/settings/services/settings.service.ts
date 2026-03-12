import apiClient from '@/services/api-client';
import { UserProfile, UpdateProfileDTO, UpdatePlanDTO } from '../types';
import { ApiResponse } from '@/types';

class SettingsService {
    private readonly baseUrl = '/users';

    async getProfile(): Promise<UserProfile> {
        const response = await apiClient.get<ApiResponse<UserProfile>>(`${this.baseUrl}/profile`);
        return response.data.data;
    }

    async updateProfile(data: UpdateProfileDTO): Promise<UserProfile> {
        const response = await apiClient.patch<ApiResponse<UserProfile>>(`${this.baseUrl}/profile`, data);
        return response.data.data;
    }

    async updatePlan(data: UpdatePlanDTO): Promise<UserProfile> {
        const response = await apiClient.patch<ApiResponse<UserProfile>>(`${this.baseUrl}/plan`, data);
        return response.data.data;
    }
}

export const settingsService = new SettingsService();
