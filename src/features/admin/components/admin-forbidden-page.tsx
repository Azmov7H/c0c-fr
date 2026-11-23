import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

/**
 * Neutral 403 page for non-admins (spec §5.2, spec §2.4): "A non-admin hits
 * /admin — a neutral 403 page, a link back to /dashboard; no permission
 * details are rendered."
 */
export function AdminForbiddenPage() {
    const t = useTranslations('admin');
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
            <h1 className="font-display text-3xl font-bold">{t('pages.forbidden.title')}</h1>
            <p className="max-w-md text-base text-muted-foreground">
                {t('pages.forbidden.message')}
            </p>
            <Button asChild variant="outline">
                <Link href="/dashboard">{t('pages.forbidden.goToDashboard')}</Link>
            </Button>
        </div>
    );
}
