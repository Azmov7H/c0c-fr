import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';

import { directionFor, routing } from '@/i18n/routing';
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

export const metadata: Metadata = {
  // Absolute URLs for OG/Twitter images resolve against this (T11 — removes
  // the "metadataBase not set" build warning and pins canonical media URLs
  // to the production domain).
  metadataBase: new URL('https://c0c-fr.vercel.app'),
  title: {
    template: '%s | AI Content Engine',
    default: 'AI Content Engine - Transform raw concepts into high-performing content',
  },
  description: 'Transform raw concepts into high-performing content. Manage projects, write scripts, and automate workflows.',
  openGraph: {
    title: 'AI Content Engine',
    description: 'Transform raw concepts into high-performing content.',
    url: 'https://c0c-fr.vercel.app',
    siteName: 'AI Content Engine',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Content Engine',
    description: 'Transform raw concepts into high-performing content.',
  },
};

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
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}>
        {/* ThemeProvider lives in AppProviders ((auth)/(dashboard) groups).
            Marketing routes use the dependency-free toggle + pre-paint script
            — see theme-pre-paint-script.tsx for the T11 budget reasoning. */}
        {children}
      </body>
    </html>
  );
}
