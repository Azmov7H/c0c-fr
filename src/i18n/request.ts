import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import * as rootParams from 'next/root-params';

import { loadMessages } from './messages';
import { routing } from './routing';

/**
 * AR03 — the server request configuration.
 *
 * This is the one place that answers "which locale is this request in?".
 *
 * Resolution order (I18N-ARCHITECTURE §4):
 *
 *   1. an explicit locale passed to an awaitable helper (`getTranslations({
 *      locale })`) — the caller knows better;
 *   2. the `[locale]` route segment, read through `next/root-params`. This
 *      is the URL, and the URL is the source of truth (AR-D-01);
 *   3. the default locale.
 *
 * A value that is not a locale this app serves never renders: it falls back
 * to the default instead of throwing, because a page that 500s on a stray
 * URL is worse than a page that renders in the default locale.
 */
export default getRequestConfig(async ({ locale }) => {
    let resolved: string | undefined = locale;

    if (!resolved) {
        try {
            resolved = await rootParams.locale();
        } catch {
            // `next/root-params` is only available inside a route. A request
            // that never reaches a page (a route handler, a prefetch of a
            // non-localized URL) must not break the request.
            resolved = undefined;
        }
    }

    const active = hasLocale(routing.locales, resolved) ? resolved : routing.defaultLocale;

    return {
        locale: active,
        messages: await loadMessages(active),
    };
});
