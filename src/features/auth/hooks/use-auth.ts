import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authService } from '../services/auth.service';
import { useAuthStore } from '@/store/auth-store';
import { LoginCredentials, RegisterCredentials } from '@/types';

const DEFAULT_AUTH_REDIRECT = '/dashboard';

interface RequestErrorShape {
    message?: string;
    code?: string;
    status?: number;
    response?: { data?: { error?: { message?: string } } };
}

function getErrorMessage(error: RequestErrorShape, fallback: string): string {
    return error?.message || error?.response?.data?.error?.message || fallback;
}

function getCallbackUrl(): string | null {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const cb = params.get('callbackUrl') || params.get('from');
    if (cb && cb.startsWith('/')) return cb;
    return null;
}

export function useLogin() {
    const router = useRouter();
    const setUser = useAuthStore((state) => state.setUser);

    return useMutation({
        mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
        onSuccess: (data) => {
            setUser(data.user);
            toast.success('Welcome back!');
            router.push(getCallbackUrl() || DEFAULT_AUTH_REDIRECT);
            router.refresh();
        },
        onError: (error: RequestErrorShape) => {
            const message = getErrorMessage(error, 'Failed to sign in. Please check your credentials.');
            toast.error(message);
        },
    });
}

export function useRegister() {
    const router = useRouter();
    const setUser = useAuthStore((state) => state.setUser);

    return useMutation({
        mutationFn: (credentials: RegisterCredentials) => authService.register(credentials),
        onSuccess: (data) => {
            setUser(data.user);
            toast.success('Account created successfully!');
            router.push(getCallbackUrl() || DEFAULT_AUTH_REDIRECT);
            router.refresh();
        },
        onError: (error: RequestErrorShape) => {
            const message = getErrorMessage(error, 'Failed to create account. Please try again.');
            toast.error(message);
        },
    });
}

export function useLogout() {
    const router = useRouter();
    const logout = useAuthStore((state) => state.logout);

    return useMutation({
        mutationFn: () => authService.logout(),
        onSuccess: () => {
            logout();
            const from = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
            router.push(`/login${from && from !== '/' ? `?from=${encodeURIComponent(from)}` : ''}`);
            router.refresh();
        },
        onError: () => {
            // Always clear the local session even if the server call fails.
            logout();
            const from = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
            router.push(`/login${from && from !== '/' ? `?from=${encodeURIComponent(from)}` : ''}`);
            router.refresh();
        },
    });
}

export function useAuth() {
    const { user, isAuthenticated, isLoading } = useAuthStore();
    return { user, isAuthenticated, isLoading };
}
