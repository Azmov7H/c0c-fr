// @vitest-environment jsdom
/** AR-039 — the cookie is the render-time cache; writing it must be deliberate. */
import { afterEach, describe, expect, it } from 'vitest';

import { LOCALE_COOKIE_MAX_AGE, LOCALE_COOKIE_NAME } from './routing';
import { setLocaleCookie } from './locale-cookie';

function clearCookies(): void {
    for (const name of document.cookie.split(';').map((part) => part.split('=')[0].trim())) {
        if (name) document.cookie = `${name}=; Path=/; Max-Age=0`;
    }
}

describe('setLocaleCookie', () => {
    afterEach(clearCookies);

    it('writes the routing cookie with the shared lifetime', () => {
        setLocaleCookie('ar');

        expect(document.cookie).toContain(`${LOCALE_COOKIE_NAME}=ar`);
        const written = document.cookie.split(';').find((part) => part.trim().startsWith(`${LOCALE_COOKIE_NAME}=`));
        expect(written?.trim()).toBe(`${LOCALE_COOKIE_NAME}=ar`);
        expect(LOCALE_COOKIE_MAX_AGE).toBeGreaterThan(0);
    });

    it('refuses a value outside the locale enum', () => {
        // A stale cookie is ignored by the router; the writer must not make one.
        setLocaleCookie('fr' as 'ar');
        expect(document.cookie).not.toContain('fr');
    });
});
