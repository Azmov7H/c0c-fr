// @vitest-environment jsdom
/**
 * AR-006 / AR-039 — the language switch.
 *
 * The switch is still a navigation: it keeps the visitor on the page they are
 * on and only changes the language. AR-039 adds two persistence effects — an
 * immediate cookie write and a dependency-free preference sync — without
 * turning the anchor into an auth-dependent control or growing the landing
 * bundle.
 */
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';

import { LocaleSwitcher } from './locale-switcher';

const mocks = vi.hoisted(() => ({
    pathname: '/en/dashboard',
    router: { replace: vi.fn(), push: vi.fn() },
    setLocaleCookie: vi.fn(),
    syncLocalePreference: vi.fn(),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => mocks.router,
    usePathname: () => mocks.pathname,
}));

vi.mock('@/i18n/locale-cookie', () => ({
    setLocaleCookie: mocks.setLocaleCookie,
}));

vi.mock('@/i18n/locale-preference-sync', () => ({
    syncLocalePreference: mocks.syncLocalePreference,
}));

function renderSwitcher() {
    const utils = render(React.createElement(LocaleSwitcher));
    const anchor = utils.getByTestId('locale-switcher') as HTMLAnchorElement;
    return anchor;
}

describe('LocaleSwitcher', () => {
    afterEach(() => {
        vi.clearAllMocks();
        mocks.pathname = '/en/dashboard';
        Object.defineProperty(window, 'location', {
            value: { ...window.location, search: '' },
            writable: true,
        });
        cleanup();
    });

    it('offers the other language, in its own script', () => {
        mocks.pathname = '/en/dashboard';
        const anchor = renderSwitcher();
        expect(anchor.textContent).toBe('العربية');
        expect(anchor.getAttribute('lang')).toBe('ar');
        expect(anchor.getAttribute('href')).toBe('/ar/dashboard');
    });

    it('an Arabic page offers English', () => {
        mocks.pathname = '/ar/pricing';
        const anchor = renderSwitcher();
        expect(anchor.textContent).toBe('English');
        expect(anchor.getAttribute('lang')).toBe('en');
        expect(anchor.getAttribute('href')).toBe('/en/pricing');
    });

    it('keeps the deep path', () => {
        mocks.pathname = '/en/projects/42';
        const anchor = renderSwitcher();
        expect(anchor.getAttribute('href')).toBe('/ar/projects/42');
    });

    it('keeps the query (the visitor does not lose the filter they typed)', () => {
        mocks.pathname = '/en/projects';
        const anchor = renderSwitcher();
        const event = new MouseEvent('click', { bubbles: true, cancelable: true });
        Object.defineProperty(window, 'location', {
            value: { ...window.location, search: '?tab=audio' },
            writable: true,
        });
        anchor.dispatchEvent(event);
        expect(mocks.router.replace).toHaveBeenCalledWith('/ar/projects?tab=audio', { scroll: false });
    });

    it('replaces rather than pushes — the back button does not walk languages', () => {
        mocks.pathname = '/en/dashboard';
        const anchor = renderSwitcher();
        const event = new MouseEvent('click', { bubbles: true, cancelable: true });
        anchor.dispatchEvent(event);
        expect(mocks.router.replace).toHaveBeenCalled();
        expect(mocks.router.push).not.toHaveBeenCalled();
    });

    it('writes the cookie and starts the preference sync before navigating', () => {
        mocks.pathname = '/en/dashboard';
        const anchor = renderSwitcher();
        anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

        expect(mocks.setLocaleCookie).toHaveBeenCalledWith('ar');
        expect(mocks.syncLocalePreference).toHaveBeenCalledWith('ar');
        expect(mocks.router.replace).toHaveBeenCalledTimes(1);
    });

    it('the Arabic page syncs English', () => {
        mocks.pathname = '/ar/dashboard';
        const anchor = renderSwitcher();
        anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

        expect(mocks.setLocaleCookie).toHaveBeenCalledWith('en');
        expect(mocks.syncLocalePreference).toHaveBeenCalledWith('en');
        expect(mocks.router.replace).toHaveBeenCalledWith('/en/dashboard', { scroll: false });
    });
});
