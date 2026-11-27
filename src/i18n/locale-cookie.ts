import {
    LOCALE_COOKIE_MAX_AGE,
    LOCALE_COOKIE_NAME,
    isAppLocale,
    type AppLocale,
} from './routing';

/**
 * AR-039 — write the locale cookie from the browser.
 *
 * AR-006 delegated persistence to the proxy: a locale-prefixed navigation made
 * the middleware answer with `Set-Cookie`. That is still true, but the DB
 * preference can now disagree with the URL (cross-device login), and the client
 * has to make the cookie agree with the authoritative locale BEFORE it
 * navigates. Otherwise the first paint of the next page would use a stale
 * cookie and flash the wrong language.
 *
 * The attributes mirror `routing.localeCookie` exactly: same name, same
 * one-year lifetime, `Path=/`, `SameSite=Lax`, and `Secure` in production (the
 * `__Host-` prefix requires it). No `Domain` — the cookie is host-only.
 */
export function setLocaleCookie(locale: AppLocale): void {
    if (typeof document === 'undefined' || !isAppLocale(locale)) return;

    const attributes = [
        `${LOCALE_COOKIE_NAME}=${locale}`,
        `Path=/`,
        `Max-Age=${LOCALE_COOKIE_MAX_AGE}`,
        'SameSite=Lax',
        ...(process.env.NODE_ENV === 'production' ? ['Secure'] : []),
    ];

    document.cookie = attributes.join('; ');
}
