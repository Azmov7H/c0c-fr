import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { config } from '@/config';
import { ApiError } from '@/lib/api-error';

export interface ApiEnvelope<T> {
    success: boolean;
    data?: T;
    meta?: unknown;
    error?: { code: string; message: string; details?: unknown };
}

const AUTH_ROUTE_PATTERN = /\/api\/auth\/(login|register|refresh|logout|session|ws-token)$/;

const apiClient = axios.create({
    baseURL: config.apiUrl,
    timeout: 30000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

let refreshPromise: Promise<boolean> | null = null;

async function performRefresh(): Promise<boolean> {
    try {
        const res = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'same-origin',
        });
        return res.ok;
    } catch {
        return false;
    }
}

function refreshSession(): Promise<boolean> {
    if (!refreshPromise) {
        refreshPromise = performRefresh().finally(() => {
            refreshPromise = null;
        });
    }
    return refreshPromise;
}

function redirectToLogin(): void {
    if (typeof window === 'undefined') return;
    const current = window.location.pathname + window.location.search;
    window.location.href = `/login?from=${encodeURIComponent(current)}`;
}

function mapHttpStatus(status?: number): string {
    switch (status) {
        case 400: return 'BAD_REQUEST';
        case 401: return 'TOKEN_EXPIRED';
        case 403: return 'FORBIDDEN';
        case 404: return 'NOT_FOUND';
        case 429: return 'RATE_LIMITED';
        case 500: return 'SERVER_ERROR';
        default: return 'UNKNOWN_ERROR';
    }
}

// 401 -> single-flight refresh -> retry once (FE-05). Error path maps to a typed
// ApiError. Success responses keep the {success, data, meta} envelope so existing
// feature services (which read response.data.data / response.data.meta) keep working.
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const requestConfig = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
        const url = requestConfig?.url || '';
        const isAuthRoute = AUTH_ROUTE_PATTERN.test(url);
        const status = error.response?.status;
        const body = error.response?.data as ApiEnvelope<never> | undefined;

        if (status === 401 && !isAuthRoute && requestConfig && !requestConfig._retried) {
            const ok = await refreshSession();
            if (ok) {
                requestConfig._retried = true;
                return apiClient.request(requestConfig);
            }
            if (typeof window !== 'undefined') {
                await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
                redirectToLogin();
            }
        }

        throw new ApiError({
            code: body?.error?.code || mapHttpStatus(status),
            message: body?.error?.message || error.message || 'Request failed',
            status,
            details: body?.error?.details,
        });
    }
);

export default apiClient;
