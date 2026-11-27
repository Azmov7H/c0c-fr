import type { Metadata } from 'next';
import { Inter, Noto_Sans_Arabic, Space_Grotesk } from 'next/font/google';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';

import { defaultLocale, directionFor, isAppLocale, routing } from '@/i18n/routing';
import { getTranslations } from '@/i18n/server';
import { rootMetadata } from '@/lib/seo/root-metadata';
import '../../styles/globals.css';

// Both faces are variable fonts — no `weight` array, so next/font ships the
// variable axis rather than several static files. `display: 'swap'` is next/font's
// default and is stated here because the brief asks for it explicitly.
// The fallback metric adjustment (size-adjust) that keeps CLS near zero is
// automatic (`adjustFontFallback`), not hand-declared.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

/**
 * AR-016 — the Arabic face.
 *
 * Noto Sans Arabic, VARIABLE, Arabic subset only (TYPOGRAPHY §2): it covers
 * the Arabic script and nothing else, so the Latin characters inside an
 * Arabic sentence fall through the stack to Inter — one Latin voice in the
 * whole product, not two. next/font self-hosts it (no external request on
 * first paint, and the CSP needs no change: `font-src 'self' data:`), and
 * `adjustFontFallback` keeps the swap from shifting the layout.
 */
const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  variable: '--font-arabic',
  display: 'swap',
});

/**
 * AR-040 — one origin, one brand, locale-aware root copy. The public pages'
 * metadata overrides the canonical/hreflang pairs; everything it inherits
 * (metadataBase, title template, site name, social card defaults) resolves
 * through the same server-side seam.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  // The segment is validated by the route, but TypeScript still sees a string:
  // narrow it once so the translator and the SEO helper agree on the locale.
  const activeLocale = isAppLocale(locale) ? locale : defaultLocale;
  const t = await getTranslations({ locale: activeLocale, namespace: 'landing' });

  return rootMetadata(activeLocale, {
    defaultTitle: t('meta.title'),
    description: t('meta.description'),
    ogTitle: t('meta.ogTitle'),
    ogDescription: t('meta.ogDescription'),
  });
}

/**
 * AR-004 — the locale segment.
 *
 * This layout is the app's ROOT layout: it renders `<html>` and `<body>` for
 * every route. The locale comes from the URL segment, which is the single
 * source of truth (AR-D-01) — the document direction is therefore decided
 * once, on the server, and never flipped on the client (RTL-DESIGN-SYSTEM
 * §1: "One direction per document, set at the server").
 *
 * `generateStaticParams` is what keeps the public pages static per locale
 * URL (SEO-REQUIREMENTS §6): a marketing page must be cacheable per URL, and
 * it must never vary by cookie.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // A URL that carries an unknown locale must not render in a guessed
  // language (FR-11): the locale router sends those to the default locale
  // first, and anything that still gets here is a genuine 404.
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale} dir={directionFor(locale)} suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${notoSansArabic.variable} font-sans`}>
        {/* ThemeProvider lives in AppProviders ((auth)/(dashboard) groups).
            Marketing routes use the dependency-free toggle + pre-paint script
            — see theme-pre-paint-script.tsx for the T11 budget reasoning. */}
        {children}
      </body>
    </html>
  );
}
