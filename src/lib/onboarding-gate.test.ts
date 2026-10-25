import { describe, expect, it } from 'vitest';

import {
    ONBOARDING_PATH,
    defaultPostAuthTarget,
    isOnboardingEditMode,
    isOnboardingIncomplete,
    onboardingRedirect,
} from './onboarding-gate';

describe('isOnboardingIncomplete', () => {
    it('true exactly when onboardingCompleted is false (in-progress state)', () => {
        expect(isOnboardingIncomplete({ onboardingCompleted: false } as never)).toBe(true);
    });

    it('completed users, missing users and undefined are NOT incomplete', () => {
        expect(isOnboardingIncomplete({ onboardingCompleted: true } as never)).toBe(false);
        expect(isOnboardingIncomplete(undefined)).toBe(false);
    });
});

describe('onboardingRedirect (T13 gate)', () => {
    it('sends an incomplete user on any other protected route to /onboarding', () => {
        expect(
            onboardingRedirect({
                pathname: '/dashboard',
                search: '',
                authenticated: true,
                onboardingCompleted: false,
            })
        ).toBe(ONBOARDING_PATH);
    });

    it('does NOT redirect an incomplete user already on /onboarding (no loop)', () => {
        expect(
            onboardingRedirect({
                pathname: '/onboarding',
                search: '',
                authenticated: true,
                onboardingCompleted: false,
            })
        ).toBeNull();
    });

    it('sends a completed user away from /onboarding', () => {
        expect(
            onboardingRedirect({
                pathname: '/onboarding',
                search: '',
                authenticated: true,
                onboardingCompleted: true,
            })
        ).toBe('/dashboard');
    });

    it('keeps a completed user on /onboarding?edit=1 (re-onboarding)', () => {
        expect(
            onboardingRedirect({
                pathname: '/onboarding',
                search: '?edit=1',
                authenticated: true,
                onboardingCompleted: true,
            })
        ).toBeNull();
    });

    it('leaves a completed user elsewhere alone', () => {
        expect(
            onboardingRedirect({
                pathname: '/projects',
                search: '',
                authenticated: true,
                onboardingCompleted: true,
            })
        ).toBeNull();
    });

    it('says nothing for an unauthenticated visitor (login handling owns that)', () => {
        expect(
            onboardingRedirect({
                pathname: '/dashboard',
                search: '',
                authenticated: false,
                onboardingCompleted: false,
            })
        ).toBeNull();
    });

    it('treats a missing flag as unknown, not incomplete', () => {
        expect(
            onboardingRedirect({
                pathname: '/dashboard',
                search: '',
                authenticated: true,
                onboardingCompleted: undefined,
            })
        ).toBeNull();
    });

    it('redirects an incomplete user away from /login too', () => {
        expect(
            onboardingRedirect({
                pathname: '/login',
                search: '',
                authenticated: true,
                onboardingCompleted: false,
            })
        ).toBe(ONBOARDING_PATH);
    });
});

describe('isOnboardingEditMode', () => {
    it('is true only for edit=1', () => {
        expect(isOnboardingEditMode('?edit=1')).toBe(true);
        expect(isOnboardingEditMode('?edit=0')).toBe(false);
        expect(isOnboardingEditMode('?tab=profile')).toBe(false);
        expect(isOnboardingEditMode('')).toBe(false);
    });
});

describe('defaultPostAuthTarget', () => {
    it('routes an incomplete user to the wizard', () => {
        expect(defaultPostAuthTarget(false)).toBe(ONBOARDING_PATH);
    });

    it('routes everyone else to the dashboard', () => {
        expect(defaultPostAuthTarget(true)).toBe('/dashboard');
        expect(defaultPostAuthTarget(undefined)).toBe('/dashboard');
    });
});
