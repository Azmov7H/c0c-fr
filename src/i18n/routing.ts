import { defineRouting } from 'next-intl/routing';

/**
 * AR02 — the locale model and the routing contract for the whole program.
 *
 * Decisions encoded here (AUDIT-REPORT §7):
 *   AR-D-01 Option A — explicit `/en` and `/ar` prefixes on every route.
 *   AR-D-12        — `/` redirects to the negotiated default locale.
 *
 * I18N-ARCHITECTURE §3: the routing table has exactly two entries. `ar` is
 * generic Arabic (MSA) for the interface; Egyptian Arabic belongs to the
 * generation-language track (AI-LOCALIZATION), not to the UI locale, so the
 * sitemap/hreflang pairs stay 1:1.
 *
 * The prefix list is intentionally NOT duplicated here: the auth gate in
 * src/proxy.ts keeps its locale-less prefix table and matches against the
 * locale-stripped path (ROUTING-STRATEGY §5).
 */
export const locales = ['en', 'ar'] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = 'en';

/**
 * Locale cookie name. The `__Host-` prefix in production mirrors the
 * session-cookie convention (src/lib/auth-cookies.ts): `__Host-` demands
 * `Secure` + `Path=/` and forbids a `Domain` attribute, and the browser
 * rejects it over plain http — hence the unprefixed development name.
 *
 * The cookie is not a secret and carries no PII (USER-PREFERENCES §7); it is
 * the guest-side persistence (FR-3) and the render-time cache for signed-in
 * users.
 */
export const LOCALE_COOKIE_NAME =
    process.env.NODE_ENV === 'production' ? '__Host-NEXT_LOCALE' : 'NEXT_LOCALE';

/** One year — a language choice is a durable preference, not a session flag. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const routing = defineRouting({
    locales,
    defaultLocale,
    // Option A: the locale is always visible in the URL (FR-8). `as-needed`
    // would make the default locale prefix-less and break the 1:1 hreflang
    // pairs (SEO-REQUIREMENTS §4).
    localePrefix: 'always',
    // The middleware negotiates the locale from the URL first, then the
    // cookie, then `Accept-Language` (I18N-ARCHITECTURE §4).
    localeDetection: true,
    localeCookie: {
        name: LOCALE_COOKIE_NAME,
        maxAge: LOCALE_COOKIE_MAX_AGE,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
    },
});

/** Is `value` a locale this app serves? */
export function isAppLocale(value: unknown): value is AppLocale {
    return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

/** The direction a locale renders in (RTL-DESIGN-SYSTEM §1). */
export function directionFor(locale: AppLocale): 'ltr' | 'rtl' {
    return locale === 'ar' ? 'rtl' : 'ltr';
}
