import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';

import { AppProviders } from '@/components/app-providers';
import { getLocale, getMessages } from '@/i18n/server';

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default async function InviteLayout({ children }: { children: React.ReactNode }) {
    // The invite landing card is a client component that reads `projects`
    // copy. This route sits outside the (auth)/(dashboard) groups, so without
    // its own provider `useTranslations('projects')` throws during SSR before
    // the preview query can render the sign-up link.
    const locale = await getLocale();
    const messages = await getMessages();

    return (
        <AppProviders>
            <NextIntlClientProvider locale={locale} messages={{ projects: messages.projects }}>
                <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-12">
                    {children}
                </main>
            </NextIntlClientProvider>
        </AppProviders>
    );
}
