import {
    defaultLocale,
    localeFromPath,
    pathInLocale,
    type AppLocale,
} from '@/i18n/routing';

import { safeCallbackUrl } from './callback-url';

/**
 * AR-039 — apply the authoritative (DB) locale to a redirect target.
 *
 * `pathInLocale` already preserves the deep path; splitting the query off
 * preserves filters and tokens. A callback that is already in the DB locale is
 * returned unchanged, so the requested locale is honoured when it matches the
 * account. A callback in the other locale (or with no prefix at all) is
 * rewritten to the DB locale — never left to flash the wrong language.
 *
 * Callers pass only same-origin targets (`safeCallbackUrl` is applied here for
 * callbacks). An external URL is rejected rather than rewritten.
 */
export function localeInTarget(target: string, locale: AppLocale): string {
    const [rawPath, ...queryParts] = target.split('?');
    const path = rawPath || '/';
    const query = queryParts.length ? `?${queryParts.join('?')}` : '';
    return `${pathInLocale(path, locale)}${query}`;
}

/** The locale the browser asked for: an explicit callback wins over the page. */
export function requestedLocale(
    callback: string | null | undefined,
    currentPath: string | null | undefined
): AppLocale {
    return localeFromPath(callback) ?? localeFromPath(currentPath) ?? defaultLocale;
}

/**
 * The landing path after login/registration. The onboarding gate outranks a
 * callback (T13), but the DB locale applies to both.
 */
export function reconcilePostAuthTarget(
    callback: string | null | undefined,
    fallbackTarget: string,
    locale: AppLocale
): string {
    const safe = safeCallbackUrl(callback);
    return localeInTarget(safe ?? fallbackTarget, locale);
}
