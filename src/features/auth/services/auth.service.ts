import { LoginCredentials, RegisterCredentials, User } from '@/types';

interface AuthResponse {
    user: User;
}

export interface SessionData {
    authenticated: boolean;
    user: User | null;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(path, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        ...options,
    });

    const data = await res.json();

    if (!res.ok) {
        throw {
            response: { data },
            message: data?.error?.message || 'Request failed',
            code: data?.error?.code,
            status: res.status,
        };
    }

    return data;
}

export const authService = {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const result = await request<{ success: boolean; data: AuthResponse }>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
        return result.data;
    },

    register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
        const result = await request<{ success: boolean; data: AuthResponse }>('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
        return result.data;
    },

    logout: async (): Promise<void> => {
        await request('/api/auth/logout', { method: 'POST' });
    },

    logoutAll: async (): Promise<{ revoked: boolean }> => {
        const result = await request<{ success: boolean; data: { revoked: boolean } }>(
            '/api/auth/logout-all',
            { method: 'POST', body: JSON.stringify({}) }
        );
        return result.data;
    },

    forgotPassword: async (email: string): Promise<{ message: string }> => {
        const result = await request<{ success: boolean; data: { message: string } }>(
            '/api/auth/forgot-password',
            { method: 'POST', body: JSON.stringify({ email }) }
        );
        return result.data;
    },

    resetPassword: async (input: { token: string; newPassword: string }): Promise<{ message: string }> => {
        const result = await request<{ success: boolean; data: { message: string } }>(
            '/api/auth/reset-password',
            { method: 'POST', body: JSON.stringify(input) }
        );
        return result.data;
    },

    verifyEmail: async (token: string): Promise<{ verified: boolean }> => {
        const result = await request<{ success: boolean; data: { verified: boolean } }>(
            '/api/auth/verify-email',
            { method: 'POST', body: JSON.stringify({ token }) }
        );
        return result.data;
    },

    resendVerification: async (): Promise<{ sent: boolean }> => {
        const result = await request<{ success: boolean; data: { sent: boolean } }>(
            '/api/auth/resend-verification',
            { method: 'POST', body: JSON.stringify({}) }
        );
        return result.data;
    },

    changePassword: async (input: { currentPassword: string; newPassword: string }): Promise<{ revoked: boolean }> => {
        const result = await request<{ success: boolean; data: { revoked: boolean } }>(
            '/api/auth/change-password',
            { method: 'POST', body: JSON.stringify(input) }
        );
        return result.data;
    },

    getSession: async (): Promise<SessionData> => {
        try {
            const result = await request<{ success: boolean; data: SessionData }>('/api/auth/session', {
                cache: 'no-store',
            });
            return result.data;
        } catch {
            return { authenticated: false, user: null };
        }
    },
};
