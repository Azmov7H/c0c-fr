import { MetadataRoute } from 'next'

import { PUBLIC_ROUTES, absolutePublicUrl } from '@/lib/public-routes'
import { locales } from '@/i18n/routing'

/**
 * Generated from the public route table (T11) — every URL here resolves to a
 * real page, enforced by src/lib/public-routes.test.ts. `lastModified` is
 * omitted deliberately: a build-time `new Date()` claims every page changed
 * on every deploy, which is noise, not freshness.
 *
 * AR-007 — the sitemap is now locale-paired. Every public page is served in
 * every locale (SEO-REQUIREMENTS §3), so every entry carries the alternates
 * map that tells a crawler which URLs are the same page in which language.
 * A page that exists in one locale only would need its own list — the
 * `alternateLanguages` helper builds the map from the locale table, so the
 * two can never drift.
 */
export default function sitemap(): MetadataRoute.Sitemap {
    return PUBLIC_ROUTES.flatMap((route) =>
        locales.map((locale) => ({
            url: absolutePublicUrl(route.path, locale),
            changeFrequency: route.changeFrequency,
            priority: route.priority,
            alternates: {
                languages: Object.fromEntries(
                    locales.map((alternate) => [alternate, absolutePublicUrl(route.path, alternate)])
                )
            },
        }))
    )
}
