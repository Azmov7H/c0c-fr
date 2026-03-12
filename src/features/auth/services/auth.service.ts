import apiClient from '@/services/api-client';
import { LoginCredentials, RegisterCredentials, AuthResponse } from '@/types';

export const authService = {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await apiClient.post<{ success: boolean; data: AuthResponse; message?: string }>(
            '/auth/login',
            credentials
        );
        return response.data.data;
    },

    register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
        const response = await apiClient.post<{ success: boolean; data: AuthResponse; message?: string }>(
            '/auth/register',
            credentials
        );
        return response.data.data;
    },

    logout: async (): Promise<void> => {
        await apiClient.post('/auth/logout');
    },
};
