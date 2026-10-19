import type { User } from '@/types';

/**
 * The onboarding route gate (T13).
 *
 * Extracted from SessionInitializer so the three redirect rules — and, above
 * all, the no-loop guarantee — are testable without mounting a component or a
 * router. The backend exposes `onboardingCompleted` on the session payload
 * (auth.service.ts sanitizeUser), so this needs no extra request; the backend's
 * `POST /projects` 428 is still the real boundary and this remains an
 * optimistic UI affordance, exactly like the middleware gate.
 */

export const ONBOARDING_PATH = '/onboarding';

/** `?edit=1` reopens the wizard for an already-onboarded user (card §9). */
export function isOnboardingEditMode(search: string): boolean {
    return new URLSearchParams(search).get('edit') === '1';
}

/**
 * Where an authenticated user belongs right after auth, when no callback URL is
 * in play. An incomplete user must land on the wizard, not the dashboard.
 */
export function defaultPostAuthTarget(onboardingCompleted?: boolean): string {
    return onboardingCompleted === false ? ONBOARDING_PATH : '/dashboard';
}

export interface OnboardingGateInput {
    pathname: string | null;
    search: string;
    authenticated: boolean;
    onboardingCompleted?: boolean;
}

/**
 * Returns the redirect target, or null when the current route is correct.
 *
 *   incomplete user off /onboarding   -> /onboarding
 *   incomplete user on  /onboarding   -> null   (this is what breaks the loop)
 *   complete   user on  /onboarding   -> /dashboard, unless ?edit=1
 *
 * Unauthenticated handling stays in SessionInitializer: this function only
 * decides the onboarding rules, so it cannot fight the login redirect.
 */
export function onboardingRedirect({
    pathname,
    search,
    authenticated,
    onboardingCompleted,
}: OnboardingGateInput): string | null {
    if (!authenticated) return null;

    const onOnboarding = pathname === ONBOARDING_PATH;

    if (onboardingCompleted === false) {
        return onOnboarding ? null : ONBOARDING_PATH;
    }

    if (onboardingCompleted === true && onOnboarding && !isOnboardingEditMode(search)) {
        return '/dashboard';
    }

    return null;
}

/** True while a session says the user has not finished onboarding. */
export function isOnboardingIncomplete(user: User | null | undefined): boolean {
    return user?.onboardingCompleted === false;
}
