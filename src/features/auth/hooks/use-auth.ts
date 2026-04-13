import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authService } from '../services/auth.service';
import { useAuthStore } from '@/store/auth-store';
import { LoginCredentials, RegisterCredentials } from '@/types';

export function useLogin() {
    const router = useRouter();
    const setUser = useAuthStore((state) => state.setUser);

    return useMutation({
        mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
        onSuccess: (data) => {
            setUser(data.user);
            toast.success('Welcome back!');
            router.push('/dashboard');
            router.refresh();
        },
        onError: (error: any) => {
            const message = error.response?.data?.error?.message || 'Failed to sign in. Please check your credentials.';
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
            router.push('/dashboard');
            router.refresh();
        },
        onError: (error: any) => {
            const message = error.response?.data?.error?.message || 'Failed to create account. Please try again.';
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
            router.push('/login');
            router.refresh();
        },
        onError: () => {
            // Still logout client-side even if server call fails
            logout();
            router.push('/login');
            router.refresh();
        },
    });
}

export function useAuth() {
    const { user, isAuthenticated, isLoading } = useAuthStore();
    return { user, isAuthenticated, isLoading };
}
