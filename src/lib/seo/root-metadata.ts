import type { Metadata } from 'next';

import { defaultLocale, isAppLocale, type AppLocale } from '@/i18n/routing';
import { absolutePublicUrl, SITE_NAME, SITE_URL } from '@/lib/public-routes';

import { ogLocale } from './public-metadata';

/**
 * AR-040 — the root metadata seam.
 *
 * The root layout applies to every route, so it must not invent its own origin
 * or brand: `metadataBase`, the title template, the social title and the social
 * URL all come from the same server-side constants the public pages use. The
 * copy is injected by the caller from the locale catalog; page-level metadata
 * still overrides the canonical and hreflang pairs for public pages.
 */
export interface RootMetadataCopy {
    defaultTitle: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
}

export function rootMetadata(
    requestedLocale: string,
    copy: RootMetadataCopy
): Metadata {
    const locale: AppLocale = isAppLocale(requestedLocale) ? requestedLocale : defaultLocale;
    const socialTitle = copy.ogTitle || SITE_NAME;

    return {
        // The BASE is the one origin — never a locale path. Absolute URLs from
        // the public-routes helpers resolve against it; a locale-specific base
        // would make relative image URLs in the Arabic face resolve twice.
        metadataBase: new URL(SITE_URL),
        // A page's own title is suffixed with the one canonical brand.
        title: {
            template: `%s | ${SITE_NAME}`,
            default: copy.defaultTitle,
        },
        description: copy.description,
        openGraph: {
            title: socialTitle,
            description: copy.ogDescription,
            url: absolutePublicUrl('/', locale),
            siteName: SITE_NAME,
            locale: ogLocale(locale),
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: socialTitle,
            description: copy.ogDescription,
        },
    };
}
