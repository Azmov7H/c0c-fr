/**
 * The public route table (T11). robots.ts and sitemap.ts both read from
 * here so they cannot advertise a page that does not exist — the old
 * sitemap listed /about, /pricing and /blog, none of which were real.
 *
 * Only pages that are public, indexable and complete belong in this list.
 * Auth pages (/login, /signup), private areas and API routes stay out.
 *
 * `src/features/landing/marketing-links.test.ts` asserts every path here has a
 * real page, that no private route leaks in, and that robots/sitemap agree.
 */
export const SITE_URL = 'https://aicontentengine.com';

export interface PublicRoute {
    path: string;
    changeFrequency: 'weekly' | 'monthly' | 'yearly';
    priority: number;
}

export const PUBLIC_ROUTES: readonly PublicRoute[] = [
    { path: '/', changeFrequency: 'weekly', priority: 1 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
];
