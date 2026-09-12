import apiClient from '@/services/api-client';
import { UserProfile, UpdateProfileDTO } from '../types';
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

    // SEC-06: self-service plan mutation removed. Plans are read-only;
    // changes go through billing/support (admin route).
}

export const settingsService = new SettingsService();
