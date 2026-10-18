import { MetadataRoute } from 'next'

import { SITE_URL } from '@/lib/public-routes'

/**
 * Regenerated in T11 from the real public route table; extended in T12 with
 * the auth-flow pages.
 *
 * The private prefixes (/dashboard, /settings, …) stay unlisted: they are
 * gated by the middleware regardless, and publishing the inventory of private
 * paths advertises the map instead of protecting anything. Auth pages are
 * different — they are linked from public pages, so they get an explicit
 * disallow. Defense in depth: the (auth) layout also sends a per-page
 * `noindex` robots meta.
 */
export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/login',
                '/signup',
                '/register',
                '/forgot-password',
                '/reset-password',
                '/verify-email',
            ],
        },
        sitemap: `${SITE_URL}/sitemap.xml`,
    }
}
