import { defaultLocale, locales } from '@/i18n/routing';

/**
 * The public route table (T11). robots.ts and sitemap.ts both read from
 * here so they cannot advertise a page that does not exist — the old
 * sitemap listed /about, /pricing and /blog, none of which were real.
 *
 * Only pages that are public, indexable and complete belong in this list.
 * Auth pages (/login, /signup), private areas and API routes stay out.
 *
 * AR-007 — the paths stay LOCALE-LESS here. A public page exists in every
 * locale, so the table describes the page, not its URLs: the sitemap pairs
 * each path with the locales it is served in (SEO-REQUIREMENTS §5), and the
 * locale list comes from the i18n layer, so a new locale is a one-line change
 * here and nowhere else.
 *
 * `src/features/landing/marketing-links.test.ts` asserts every path here has a
 * real page, that no private route leaks in, and that robots/sitemap agree.
 */
/**
 * AR-040 — the one public origin. The server-side `SITE_URL` (NOT a
 * `NEXT_PUBLIC_` value) feeds metadataBase, canonical/OG URLs, the sitemap and
 * robots, so a deploy cannot advertise one domain from the head and another
 * from the sitemap. The fallback is the current production origin; a value
 * with a path/query/credentials is rejected because the contract is an origin.
 */
function siteUrlFromEnv(): string {
    const configured = process.env.SITE_URL?.trim() || 'https://avyra-an.vercel.app';
    const parsed = new URL(configured);
    if (
        parsed.pathname !== '/' ||
        parsed.search ||
        parsed.hash ||
        parsed.username ||
        parsed.password
    ) {
        throw new Error('SITE_URL must be an origin, for example https://example.com');
    }
    return parsed.origin;
}

export const SITE_URL = siteUrlFromEnv();

/**
 * The site's name, as the layout's title template spells it.
 *
 * AR-025/AR-040: this is the canonical brand (`Avyra || AI Content Engine`).
 * The root layout, the public pages' Open Graph cards, the sitemap and the
 * tests all consume this one constant — a card cannot claim a different site
 * than the page it links to.
 */
export const SITE_NAME = 'Avyra || AI Content Engine';

export interface PublicRoute {
    path: string;
    changeFrequency: 'weekly' | 'monthly' | 'yearly';
    priority: number;
}

export const PUBLIC_ROUTES: readonly PublicRoute[] = [
    { path: '/', changeFrequency: 'weekly', priority: 1 },
    { path: '/pricing', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
];

/**
 * The public URL of a page in one locale: `/pricing` → `/en/pricing`,
 * `/` → `/en`.
 */
export function publicUrl(path: string, locale: string): string {
    const suffix = path === '/' ? '' : path;
    return `/${locale}${suffix}`;
}

/**
 * The absolute URL of a page in one locale — the form the sitemap, the
 * canonical tags and the hreflang pairs use.
 */
export function absolutePublicUrl(path: string, locale: string): string {
    return `${SITE_URL}${publicUrl(path, locale)}`;
}

/**
 * The hreflang map of a page: every locale it is served in, pointing at the
 * absolute URL of that locale (SEO-REQUIREMENTS §4).
 *
 * `x-default` points at the default locale, which is where a crawler that
 * sends no `Accept-Language` is sent.
 */
export function alternateLanguages(path: string): Record<string, string> {
    const languages: Record<string, string> = {};
    for (const locale of locales) {
        languages[locale] = absolutePublicUrl(path, locale);
    }
    // AR-025: `x-default` is the URL a crawler that sends no `Accept-Language`
    // is sent to — the default locale's face of the same page.
    languages['x-default'] = absolutePublicUrl(path, defaultLocale);
    return languages;
}
