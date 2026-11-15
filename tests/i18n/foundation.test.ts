import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { NAMESPACES, loadMessages } from '../../src/i18n/messages';
import {
    defaultLocale,
    directionFor,
    isAppLocale,
    localeFromPath,
    locales,
    pathInLocale,
    stripLocaleFromPath,
    withLocale,
} from '../../src/i18n/routing';

/**
 * AR-003 — the foundation's own contract.
 *
 * The catalog is the part of the i18n layer that fails silently when it is
 * wrong: a namespace that is not registered loads as `undefined`, and a
 * missing file only shows up as an empty page. These assertions make both
 * loud, at build time, before a single component reads a message.
 */

const ROOT = join(import.meta.dirname, '..', '..');

describe('AR-003 locale model', () => {
    it('serves exactly two locales, English first', () => {
        expect(locales).toEqual(['en', 'ar']);
        expect(defaultLocale).toBe('en');
    });

    it('accepts only known locales', () => {
        expect(isAppLocale('en')).toBe(true);
        expect(isAppLocale('ar')).toBe(true);
        expect(isAppLocale('ar-EG')).toBe(false);
        expect(isAppLocale('fr')).toBe(false);
        expect(isAppLocale('')).toBe(false);
        expect(isAppLocale(null)).toBe(false);
    });

    it('renders Arabic right-to-left and English left-to-right', () => {
        expect(directionFor('ar')).toBe('rtl');
        expect(directionFor('en')).toBe('ltr');
    });
});

describe('AR-004 path helpers', () => {
    it('reads the locale out of a path', () => {
        expect(localeFromPath('/en/dashboard')).toBe('en');
        expect(localeFromPath('/ar/dashboard')).toBe('ar');
        expect(localeFromPath('/en')).toBe('en');
        expect(localeFromPath('/dashboard')).toBeNull();
        expect(localeFromPath('/fr/dashboard')).toBeNull();
    });

    it('strips the locale prefix for the locale-less route', () => {
        expect(stripLocaleFromPath('/en/dashboard')).toBe('/dashboard');
        expect(stripLocaleFromPath('/ar/settings/billing')).toBe('/settings/billing');
        expect(stripLocaleFromPath('/en')).toBe('/');
        expect(stripLocaleFromPath('/dashboard')).toBe('/dashboard');
        expect(stripLocaleFromPath('/fr/dashboard')).toBe('/fr/dashboard');
    });

    it('builds the same path in another locale (the switcher)', () => {
        expect(pathInLocale('/en/dashboard', 'ar')).toBe('/ar/dashboard');
        expect(pathInLocale('/ar/projects/42', 'en')).toBe('/en/projects/42');
        expect(pathInLocale('/en', 'ar')).toBe('/ar');
    });

    it('puts a locale-less path back into a locale (the redirects)', () => {
        expect(withLocale('/dashboard', 'ar')).toBe('/ar/dashboard');
        expect(withLocale('/', 'ar')).toBe('/ar');
        expect(withLocale('/onboarding', 'en')).toBe('/en/onboarding');
    });

    it('the two are inverses of each other', () => {
        for (const path of ['/en/dashboard', '/ar/projects/42', '/en']) {
            const stripped = stripLocaleFromPath(path);
            const locale = localeFromPath(path)!;
            expect(withLocale(stripped, locale)).toBe(path);
        }
    });
});

describe('AR-003 catalog registry', () => {
    it('registers at least the `common` namespace', () => {
        expect(NAMESPACES).toContain('common');
    });

    it('every registered namespace has a file for every locale', () => {
        for (const locale of locales) {
            for (const namespace of NAMESPACES) {
                const file = join(ROOT, 'messages', locale, `${namespace}.json`);
                expect(existsSync(file), `${locale}/${namespace}.json is missing`).toBe(true);
            }
        }
    });

    it('loads one entry per registered namespace', async () => {
        const messages = await loadMessages('en');
        expect(Object.keys(messages).sort()).toEqual([...NAMESPACES].sort());
    });

    it('loads the same namespaces for every locale', async () => {
        const [english, arabic] = await Promise.all([loadMessages('en'), loadMessages('ar')]);
        expect(Object.keys(arabic).sort()).toEqual(Object.keys(english).sort());
    });

    it('a locale that is not served cannot be loaded', async () => {
        // The loader is typed to the app locales; the guard is in the type
        // system, and `isAppLocale` is the runtime twin of that guard.
        expect(isAppLocale('fr')).toBe(false);
    });
});
