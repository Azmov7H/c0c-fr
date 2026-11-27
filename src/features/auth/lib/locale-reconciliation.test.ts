import { describe, expect, it } from 'vitest';

import {
    localeInTarget,
    reconcilePostAuthTarget,
    requestedLocale,
} from './locale-reconciliation';

describe('AR-039 locale reconciliation', () => {
    it('keeps a deep path and query while swapping the locale prefix', () => {
        expect(localeInTarget('/en/projects/42?tab=audio', 'ar')).toBe('/ar/projects/42?tab=audio');
    });

    it('adds the DB locale when the callback has no prefix', () => {
        expect(localeInTarget('/projects/42', 'ar')).toBe('/ar/projects/42');
    });

    it('leaves a callback already in the DB locale untouched', () => {
        expect(localeInTarget('/ar/dashboard?tab=all', 'ar')).toBe('/ar/dashboard?tab=all');
    });

    it('prefers an explicit callback locale over the page locale', () => {
        expect(requestedLocale('/ar/dashboard', '/en/login')).toBe('ar');
        expect(requestedLocale('/dashboard', '/en/login')).toBe('en');
    });

    it('reconciles a safe callback and rejects an open redirect', () => {
        expect(reconcilePostAuthTarget('/en/dashboard', '/dashboard', 'ar')).toBe('/ar/dashboard');
        expect(reconcilePostAuthTarget('//evil.com', '/dashboard', 'ar')).toBe('/ar/dashboard');
    });
});
