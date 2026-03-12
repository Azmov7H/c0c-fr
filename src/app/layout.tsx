import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import '../styles/globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/sonner';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
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
      <body className={`${spaceGrotesk.className} font-sans`}>
        <Providers
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
