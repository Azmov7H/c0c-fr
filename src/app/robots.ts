import { MetadataRoute } from 'next'

import { SITE_URL } from '@/lib/public-routes'

/**
 * Regenerated in T11 from the real public route table.
 *
 * The old `disallow` list enumerated every private prefix (/dashboard,
 * /settings, /projects, …). That list is gone: those routes are gated by the
 * middleware regardless of what a crawler is told, and publishing the
 * inventory of private paths in robots.txt advertises the map instead of
 * protecting anything. `/api/` needs no entry either — API responses are not
 * documents and carry no links into the site.
 */
export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
        },
        sitemap: `${SITE_URL}/sitemap.xml`,
    }
}
