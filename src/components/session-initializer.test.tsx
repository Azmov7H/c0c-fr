// @vitest-environment jsdom
/** T18 P0: the mounted session initializer is the last line before a
 *  signed-out visitor sees app chrome (or an expired session lingers on a
 *  login page). The gate maths is covered in onboarding-gate.test.ts; these
 *  are the wiring rules a pure unit cannot express.
 */
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { SessionInitializer } from './session-initializer';

const mocks = vi.hoisted(() => ({
    session: {
        authenticated: false,
        user: null,
    } as { authenticated: boolean; user: Record<string, unknown> | null },
    sessionError: false,
    pathname: '/dashboard',
    router: { replace: vi.fn(), push: vi.fn(), refresh: vi.fn(), back: vi.fn() },
    setUser: vi.fn(),
    setLoading: vi.fn(),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => mocks.router,
    usePathname: () => mocks.pathname,
}));

vi.mock('@/features/auth/services/auth.service', () => ({
    authService: {
        getSession: async () => {
            if (mocks.sessionError) throw new Error('network down');
            return mocks.session;
        },
    },
}));

vi.mock('@/store/auth-store', () => ({
    useAuthStore: () => ({
        setUser: mocks.setUser,
        setLoading: mocks.setLoading,
    }),
}));

const completeUser = {
    id: 'u1',
    email: 'a@b.c',
    name: 'A',
    role: 'user',
    onboardingCompleted: true,
};

/** The last replace() target observed, or null while no redirect happened. */
function firstReplace(): string | null {
    return mocks.router.replace.mock.calls[0]?.[0] ?? null;
}

function mount(pathname: string, search = '') {
    mocks.pathname = pathname;
    window.history.replaceState(null, '', pathname + (search ? `?${search}` : ''));
    // Next.js reads location.search on the useEffect body (not the pathname),
    // so the replaceState above is what the callback logic sees.
    render(React.createElement(SessionInitializer));
}

describe('SessionInitializer', () => {
    afterEach(() => {
        vi.clearAllMocks();
        mocks.session = { authenticated: false, user: null };
        mocks.sessionError = false;
        cleanup();
    });

    it('authenticated complete user on an app page → user set, no redirect, loading settles', async () => {
        mocks.session = { authenticated: true, user: completeUser };
        mount('/dashboard');

        await vi.waitFor(() => expect(mocks.setLoading).toHaveBeenLastCalledWith(false));
        expect(mocks.setUser).toHaveBeenCalledWith(completeUser);
        expect(firstReplace()).toBeNull();
    });

    it('incomplete onboarding → optimistic gate routes to the wizard', async () => {
        mocks.session = {
            authenticated: true,
            user: { ...completeUser, onboardingCompleted: false },
        };
        mount('/dashboard');

        await vi.waitFor(() => expect(firstReplace()).not.toBeNull());
        expect(firstReplace()).toBe('/onboarding');
    });

    it('complete user parked on /onboarding is escorted back out (no edit param)', async () => {
        mocks.session = { authenticated: true, user: completeUser };
        mount('/onboarding');

        await vi.waitFor(() => expect(firstReplace()).not.toBeNull());
        expect(firstReplace()).toBe('/dashboard');
    });

    it('authenticated user on /login bounces to the callbackUrl ?from= target', async () => {
        mocks.session = { authenticated: true, user: completeUser };
        mount('/login', 'from=/projects/42');

        await vi.waitFor(() => expect(firstReplace()).not.toBeNull());
        expect(firstReplace()).toBe('/projects/42');
    });

    it('authenticated user on /login without a callback lands on the default target', async () => {
        mocks.session = { authenticated: true, user: completeUser };
        mount('/login');

        await vi.waitFor(() => expect(firstReplace()).not.toBeNull());
        expect(firstReplace()).toBe('/dashboard');
    });

    it('untrusted callbackUrl (open redirect) is ignored → default target', async () => {
        mocks.session = { authenticated: true, user: completeUser };
        mount('/login', 'callbackUrl=//evil.com');

        await vi.waitFor(() => expect(firstReplace()).not.toBeNull());
        expect(firstReplace()).toBe('/dashboard');
    });

    it('signed-out visitor on an app page → login carries the current path as callback', async () => {
        mount('/dashboard/projects');

        await vi.waitFor(() => expect(firstReplace()).not.toBeNull());
        expect(mocks.setUser).toHaveBeenCalledWith(null);
        expect(firstReplace()).toBe('/login?callbackUrl=%2Fdashboard%2Fprojects');
    });

    it('signed-out visitor on an auth-flow page → no redirect loop', async () => {
        mount('/login');

        await vi.waitFor(() => expect(mocks.setLoading).toHaveBeenLastCalledWith(false));
        expect(mocks.setUser).toHaveBeenCalledWith(null);
        expect(firstReplace()).toBeNull();
    });

    it('signed-out visitor on /invites/token → stays (accepting an invite may precede signup)', async () => {
        mount('/invites', 'token=tok-123');

        await vi.waitFor(() => expect(mocks.setLoading).toHaveBeenLastCalledWith(false));
        expect(mocks.setUser).toHaveBeenCalledWith(null);
        expect(firstReplace()).toBeNull();
    });

    it('the session endpoint itself fails → loading settles with no user and no redirect', async () => {
        mocks.sessionError = true;
        mount('/dashboard');

        await vi.waitFor(() => expect(mocks.setLoading).toHaveBeenLastCalledWith(false));
        // The catch branch deliberately does not navigate: with the network
        // down, /login would sit on top of a dead session anyway. The next real
        // navigation (middleware, or the app-shell guard) sends the user on.
        expect(mocks.setUser).toHaveBeenCalledWith(null);
        expect(firstReplace()).toBeNull();
    });
});
