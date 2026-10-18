import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import '../styles/globals.css';

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
  metadataBase: new URL('https://aicontentengine.com'),
  title: {
    template: '%s | AI Content Engine',
    default: 'AI Content Engine - Transform raw concepts into high-performing content',
  },
  description: 'Transform raw concepts into high-performing content. Manage projects, write scripts, and automate workflows.',
  openGraph: {
    title: 'AI Content Engine',
    description: 'Transform raw concepts into high-performing content.',
    url: 'https://aicontentengine.com',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}>
        {/* ThemeProvider lives in AppProviders ((auth)/(dashboard) groups).
            Marketing routes use the dependency-free toggle + pre-paint script
            — see theme-pre-paint-script.tsx for the T11 budget reasoning. */}
        {children}
      </body>
    </html>
  );
}
