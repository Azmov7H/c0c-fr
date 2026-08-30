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
