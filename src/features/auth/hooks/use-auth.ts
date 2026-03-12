import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authService } from '../services/auth.service';
import { useAuthStore } from '@/store/auth-store';
import { LoginCredentials, RegisterCredentials } from '@/types';

export function useLogin() {
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);

    return useMutation({
        mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
        onSuccess: (data) => {
            setAuth(data.user, data.accessToken);
            toast.success('Welcome back!');
            router.push('/dashboard');
        },
        onError: (error: any) => {
            const message = error.response?.data?.error?.message || 'Failed to sign in. Please check your credentials.';
            toast.error(message);
        },
    });
}

export function useRegister() {
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);

    return useMutation({
        mutationFn: (credentials: RegisterCredentials) => authService.register(credentials),
        onSuccess: (data) => {
            setAuth(data.user, data.accessToken);
            toast.success('Account created successfully!');
            router.push('/dashboard');
        },
        onError: (error: any) => {
            const message = error.response?.data?.error?.message || 'Failed to create account. Please try again.';
            toast.error(message);
        },
    });
}
export function useAuth() {
    const { user, accessToken, setAuth, logout } = useAuthStore();
    return { user, accessToken, setAuth, logout };
}
