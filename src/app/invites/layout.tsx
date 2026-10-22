import type { Metadata } from 'next';

import { AppProviders } from '@/components/app-providers';

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function InviteLayout({ children }: { children: React.ReactNode }) {
    return (
        <AppProviders>
            <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-12">
                {children}
            </main>
        </AppProviders>
    );
}
