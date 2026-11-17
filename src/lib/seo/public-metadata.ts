import type { Metadata } from 'next';

import type { AppLocale } from '@/i18n/routing';
import { locales } from '@/i18n/routing';
import {
    absolutePublicUrl,
    alternateLanguages,
    SITE_NAME,
} from '@/lib/public-routes';

/**
 * AR-025 — the public pages' metadata.
 *
 * The public pages are the same page in two languages, and the SEO surface
 * has to say so:
 *
 *   - the CANONICAL is the URL of THIS locale. One canonical for both
 *     locales is a bug, not a simplification: it tells a crawler that the
 *     Arabic page is a duplicate of the English one, and the Arabic page
 *     drops out of the index.
 *   - the HREFLANG PAIRS tell the crawler which URL is which language of the
 *     same page, and `x-default` tells it where a crawler that sends no
 *     `Accept-Language` belongs.
 *   - the OPEN GRAPH LOCALE follows the page's locale, and
 *     `og:locale:alternate` names the other face of the same page — an
 *     Arabic card that claims `en_US` is a card for the wrong audience.
 *
 * The URLs are not copy: they are built from the public route table, so a
 * new locale cannot be half-advertised and the canonical can never drift
 * from the sitemap.
 */
export interface PublicPageMetadataInput {
    /** The locale-less public path (`/`, `/pricing`, `/privacy`, `/terms`). */
    path: string;
    /** The locale the page is rendered in. */
    locale: AppLocale;
    /** The page title — the layout's template appends the site name. */
    title: string;
    /** The page description. */
    description: string;
    /** The Open Graph title; the page title when it is not given. */
    ogTitle?: string;
    /** The Open Graph description; the page description when it is not given. */
    ogDescription?: string;
}

/**
 * The Open Graph locale of an app locale (SEO-REQUIREMENTS §4).
 *
 * `ar` is MSA (`ar_AR`), not `ar_EG`: the interface locale is generic
 * Arabic (I18N-ARCHITECTURE §3), and the OG locale is the interface's.
 */
export const OG_LOCALES: Record<AppLocale, string> = {
    en: 'en_US',
    ar: 'ar_AR',
};

/** The Open Graph locale of an app locale. */
export function ogLocale(locale: AppLocale): string {
    return OG_LOCALES[locale] ?? OG_LOCALES.en;
}

/**
 * The metadata of a public page, in the locale the page is rendered in.
 */
export function publicPageMetadata({
    path,
    locale,
    title,
    description,
    ogTitle,
    ogDescription,
}: PublicPageMetadataInput): Metadata {
    const url = absolutePublicUrl(path, locale);
    const socialTitle = ogTitle ?? title;
    const socialDescription = ogDescription ?? description;

    return {
        title,
        description,
        alternates: {
            // The canonical is THIS locale's URL — never the locale-less one.
            canonical: url,
            // The hreflang pairs: every locale of this page, plus x-default.
            languages: alternateLanguages(path),
        },
        openGraph: {
            title: socialTitle,
            description: socialDescription,
            url,
            siteName: SITE_NAME,
            locale: ogLocale(locale),
            // The other face of the same page.
            alternateLocale: locales
                .filter((alternate) => alternate !== locale)
                .map((alternate) => ogLocale(alternate)),
            type: 'website',
            // og:image comes from opengraph-image.tsx (next/og, 1200×630).
        },
        twitter: {
            card: 'summary_large_image',
            title: socialTitle,
            description: socialDescription,
        },
    };
}
