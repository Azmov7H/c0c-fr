import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import { routing } from './routing';

/**
 * AR02 — the server request configuration.
 *
 * `next-intl` calls this once per request to learn which locale to render and
 * which messages to load. AR-002 ships the wiring with an empty catalog (the
 * catalogs arrive with AR-009/AR-010), so the spike proves the plugin,
 * the request config and the middleware agree on one locale — without
 * changing a single rendered string.
 *
 * Locale resolution (I18N-ARCHITECTURE §4):
 *   1. the URL prefix wins (the middleware sets it on the request);
 *   2. an unknown/garbage value falls back to the default locale rather
 *      than throwing — the page must render, not 500.
 */
export default getRequestConfig(async ({ requestLocale }) => {
    const requested = await requestLocale;
    const locale = hasLocale(routing.locales, requested)
        ? requested
        : routing.defaultLocale;

    return {
        locale,
        // AR-002: no catalog yet. AR-009 seeds `common`, AR-010 the rest.
        messages: {},
    };
});
