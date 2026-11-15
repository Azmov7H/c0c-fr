import { MetadataRoute } from 'next'

import { SITE_URL } from '@/lib/public-routes'
import { locales } from '@/i18n/routing'

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
 *
 * AR-007 — the auth pages now exist in every locale, so the disallow list
 * carries the PREFIXED paths as well (/en/login, /ar/login, …). The bare
 * paths stay listed too: they still answer, with the locale redirect, and a
 * crawler that follows it lands on a prefixed URL that must not be indexed
 * either.
 */
const AUTH_PATHS = [
    '/login',
    '/signup',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
]

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                ...AUTH_PATHS,
                ...locales.flatMap((locale) => AUTH_PATHS.map((path) => `/${locale}${path}`)),
            ],
        },
        sitemap: `${SITE_URL}/sitemap.xml`,
    }
}
