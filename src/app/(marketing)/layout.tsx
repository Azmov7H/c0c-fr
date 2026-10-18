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
                marketing routes deliberately do not mount next-themes (T11
                bundle budget) — see the component for the full reasoning. */}
            <ThemePrePaintScript />
            <MarketingHeader />
            <main className="flex-1">{children}</main>
            <MarketingFooter />
        </div>
    );
}
