/*
 * Setup for the jsdom project: component and hook tests.
 *
 * Owns the two things every DOM test needs but no test should repeat:
 * semantic matchers and a matchMedia polyfill (jsdom has no layout engine,
 * so any component reading `window.matchMedia` — e.g. useIsMobile — would
 * otherwise crash).
 */
import '@testing-library/jest-dom/vitest';

import { beforeAll, afterAll } from 'vitest';

if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        writable: true,
        value: (query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => false,
        }),
    });
}

// jsdom does not implement scrollIntoView; Radix portals use it on focus.
beforeAll(() => {
    Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || (() => {});
});

process.env.VITEST_JSDOM_PROJECT = '1';
afterAll(() => {
    document.body.innerHTML = '';
});
