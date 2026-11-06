import { MarketingHeader } from '@/components/layout/marketing-header';
import { MarketingFooter } from '@/components/layout/marketing-footer';
import { ThemePrePaintScript } from '@/components/theme-pre-paint-script';

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            {/* Applies the stored theme class before first paint; the
                marketing routes deliberately do not mount the app theme provider (T11
                bundle budget) — see the component for the full reasoning. */}
            <ThemePrePaintScript />
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
            >
                Skip to content
            </a>
            <MarketingHeader />
            <main id="main-content" tabIndex={-1} className="flex-1">
                {children}
            </main>
            <MarketingFooter />
        </div>
    );
}
