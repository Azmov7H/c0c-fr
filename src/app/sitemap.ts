import { MetadataRoute } from 'next'

import { PUBLIC_ROUTES, SITE_URL } from '@/lib/public-routes'

/**
 * Generated from the public route table (T11) — every URL here resolves to a
 * real page, enforced by src/lib/public-routes.test.ts. `lastModified` is
 * omitted deliberately: a build-time `new Date()` claims every page changed
 * on every deploy, which is noise, not freshness.
 */
export default function sitemap(): MetadataRoute.Sitemap {
    return PUBLIC_ROUTES.map((route) => ({
        url: route.path === '/' ? SITE_URL : `${SITE_URL}${route.path}`,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
    }))
}
