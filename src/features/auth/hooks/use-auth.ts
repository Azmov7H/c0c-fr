import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from '@/lib/toast';
import { setLocaleCookie } from '@/i18n/locale-cookie';
import { authService } from '../services/auth.service';
import { markAuthenticated } from '../lib/auth-presence';
import { useAuthStore } from '@/store/auth-store';
import { LoginCredentials, RegisterCredentials, User } from '@/types';
import { localePreferenceService } from '@/services/locale-preference.service';
import { reconcilePostAuthTarget, requestedLocale } from '../lib/locale-reconciliation';
import { safeCallbackUrl } from '../lib/callback-url';
import { defaultPostAuthTarget } from '@/lib/onboarding-gate';
import { trackEvent } from '@/lib/analytics';

function getCallbackUrl(): string | null {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return safeCallbackUrl(params.get('callbackUrl') || params.get('from'));
}

/**
 * T13: a freshly authed user who has not onboarded goes to the wizard, not the
 * dashboard — the backend 428s project creation until then. The onboarding rule
 * outranks a callback URL for the same reason.
 *
 * AR-039: the DB preference decides the locale of that landing path. The
 * callback's deep path and query survive; only its locale prefix is reconciled.
 * If the preference endpoint is unavailable, the locale the browser asked for
 * (callback first, then the current page) is kept — no invented DB value.
 */
async function postAuthTarget(user: User): Promise<string> {
    const callback = getCallbackUrl();
    let locale = requestedLocale(
        callback,
        typeof window === 'undefined' ? null : window.location.pathname
    );
    try {
        locale = await localePreferenceService.get();
        setLocaleCookie(locale);
    } catch {
        // Keep the requested locale and the existing cookie.
    }

    const fallback = user.onboardingCompleted === false
        ? defaultPostAuthTarget(false)
        : defaultPostAuthTarget(true);
    return reconcilePostAuthTarget(
        user.onboardingCompleted === false ? null : callback,
        fallback,
        locale
    );
}

/**
 * T12: form hooks no longer toast errors — the forms render mapped, inline,
 * non-jumping errors (role="alert") instead. Success toasts stay: they confirm
 * a completed action before the redirect lands. `mapAuthError` in
 * ../lib/auth-error-map.ts is the one place error copy is chosen.
 */
export function useLogin() {
    // AR-026: the toast is copy.
    const t = useTranslations('auth');
    const router = useRouter();
    const setUser = useAuthStore((state) => state.setUser);

    return useMutation({
        mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
        onSuccess: async (data) => {
            setUser(data.user);
            markAuthenticated(true);
            toast.success(t('toast.welcomeBack'));
            router.push(await postAuthTarget(data.user));
            router.refresh();
        },
    });
}

export function useRegister() {
    // AR-026: the toast is copy.
    const t = useTranslations('auth');
    const router = useRouter();
    const setUser = useAuthStore((state) => state.setUser);

    return useMutation({
        mutationFn: (credentials: RegisterCredentials) => authService.register(credentials),
        onSuccess: async (data) => {
            setUser(data.user);
            markAuthenticated(true);
            trackEvent('signup_completed');
            toast.success(t('toast.accountCreated'));
            router.push(await postAuthTarget(data.user));
            router.refresh();
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
            markAuthenticated(false);
            const from = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
            router.push(`/login${from && from !== '/' ? `?from=${encodeURIComponent(from)}` : ''}`);
            router.refresh();
        },
        onError: () => {
            // Always clear the local session even if the server call fails.
            logout();
            markAuthenticated(false);
            const from = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
            router.push(`/login${from && from !== '/' ? `?from=${encodeURIComponent(from)}` : ''}`);
            router.refresh();
        },
    });
}

export function useForgotPassword() {
    return useMutation({
        mutationFn: (email: string) => authService.forgotPassword(email),
    });
}

export function useResetPassword() {
    const router = useRouter();

    return useMutation({
        mutationFn: (input: { token: string; newPassword: string }) => authService.resetPassword(input),
        onSuccess: () => {
            // Completion event only — never the password itself (src/lib/analytics.ts).
            trackEvent('password_reset_completed');
            router.push('/login?reset=1');
            router.refresh();
        },
    });
}

export function useVerifyEmail() {
    return useMutation({
        mutationFn: (token: string) => authService.verifyEmail(token),
    });
}

export function useResendVerification() {
    return useMutation({
        mutationFn: () => authService.resendVerification(),
    });
}

/**
 * Password change ends every session, including this one (T02 bumps
 * tokenVersion and revokes refresh tokens). The whole client cache is dropped
 * before the redirect so no private data survives the sign-out.
 */
export function useChangePassword() {
    const router = useRouter();
    const logout = useAuthStore((state) => state.logout);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: { currentPassword: string; newPassword: string }) =>
            authService.changePassword(input),
        onSuccess: () => {
            queryClient.clear();
            logout();
            router.push('/login?changed=1');
            router.refresh();
        },
    });
}

export function useLogoutAll() {
    const router = useRouter();
    const logout = useAuthStore((state) => state.logout);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => authService.logoutAll(),
        onSuccess: () => {
            queryClient.clear();
            logout();
            router.push('/login?signout=1');
            router.refresh();
        },
    });
}

export function useAuth() {
    const { user, isAuthenticated, isLoading } = useAuthStore();
    return { user, isAuthenticated, isLoading };
}
