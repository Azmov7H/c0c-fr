import { LoginCredentials, RegisterCredentials, User } from '@/types';

interface AuthResponse {
    user: User;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(path, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });

    const data = await res.json();

    if (!res.ok) {
        throw { response: { data } };
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

    getSession: async (): Promise<User | null> => {
        try {
            const result = await request<{ success: boolean; data: User }>('/api/auth/session');
            return result.data;
        } catch {
            return null;
        }
    },
};
