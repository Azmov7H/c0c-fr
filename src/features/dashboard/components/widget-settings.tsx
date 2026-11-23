'use client';

import { Settings2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DASHBOARD_WIDGET_IDS,
    WIDGET_LABEL_KEYS,
    type DashboardPreferences,
    type DashboardWidgetId,
} from '../lib/widget-layout';

/**
 * T20: split out of `dashboard-view.tsx` and loaded on first interaction.
 *
 * The customise dialog is closed on every page load — it only exists once the
 * visitor clicks. Keeping it in the page module put the Radix dialog runtime
 * on the dashboard's first-load path for a control most sessions never open.
 */
export function WidgetSettings({
    preferences,
    pending,
    onToggle,
    onShowAll,
}: {
    preferences: DashboardPreferences;
    pending: boolean;
    onToggle: (id: DashboardWidgetId, hidden: boolean) => void;
    onShowAll: () => void;
}) {
    const t = useTranslations('dashboard');
    const hidden = new Set(preferences.hiddenWidgets);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 rounded-xl px-4">
                    <Settings2 className="me-1.5 size-3.5" aria-hidden="true" />
                    {t('settings.trigger')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('settings.title')}</DialogTitle>
                    <DialogDescription>{t('settings.description')}</DialogDescription>
                </DialogHeader>

                <ul className="space-y-1">
                    {DASHBOARD_WIDGET_IDS.map((id) => (
                        <li key={id}>
                            <label className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-muted/50">
                                <span>{t(WIDGET_LABEL_KEYS[id])}</span>
                                <input
                                    type="checkbox"
                                    className="size-4 accent-primary"
                                    checked={!hidden.has(id)}
                                    disabled={pending}
                                    onChange={(event) => onToggle(id, !event.target.checked)}
                                    aria-label={t('settings.showAria', {
                                        widget: t(WIDGET_LABEL_KEYS[id]),
                                    })}
                                />
                            </label>
                        </li>
                    ))}
                </ul>

                <Button variant="ghost" size="sm" onClick={onShowAll} disabled={pending}>
                    {t('settings.showAll')}
                </Button>
            </DialogContent>
        </Dialog>
    );
}
