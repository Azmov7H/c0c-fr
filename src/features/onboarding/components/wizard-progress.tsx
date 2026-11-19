'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';

import { useUrlLocale } from '@/i18n/locale';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { localizeTaxonomyLabel } from '../lib/taxonomy-labels';

interface WizardProgressProps {
    /** Zero-based index of the current step. */
    current: number;
    total: number;
    /** Step definitions from the API taxonomy (may be shorter than `total`). */
    steps?: readonly { key: string; label: string }[];
}

/**
 * Position and total, in words and as a bar.
 *
 * The last stop reads "Finish" rather than "Step 6" (card §4) — it is a
 * confirmation, not another question. `aria-current="step"` marks the active
 * item for screen readers. AR-029: every visible word comes from the
 * `onboarding` catalog; the last stop uses `progress.finish`.
 */
export function WizardProgress({ current, total, steps }: WizardProgressProps) {
    const t = useTranslations('onboarding');
    const locale = useUrlLocale();
    const lastIndex = total - 1;

    const stepLabel = (index: number): string => {
        const backend = steps?.[index];
        return backend
            ? localizeTaxonomyLabel(locale, t, 'steps', backend.key, backend.label)
            : t('progress.stepFallback', { step: index + 1 });
    };
    const currentLabel = current === lastIndex ? t('progress.finish') : stepLabel(current);

    return (
        <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-4">
                <p className="text-sm font-medium" aria-live="polite">
                    {current === lastIndex ? (
                        t('progress.finish')
                    ) : (
                        <>
                            {t('progress.stepOf', { current: current + 1, total })}
                            <span className="text-muted-foreground"> · {currentLabel}</span>
                        </>
                    )}
                </p>
                <p className="text-xs text-muted-foreground">{current + 1}/{total}</p>
            </div>

            <Progress
                value={((current + 1) / total) * 100}
                aria-label={t('progress.ariaLabel', { current: current + 1, total })}
            />

            <ol className="flex flex-wrap gap-x-3 gap-y-1">
                {Array.from({ length: total }).map((_, index) => {
                    const isCurrent = index === current;
                    const label = index === lastIndex ? t('progress.finish') : stepLabel(index);
                    return (
                        <li
                            key={index}
                            aria-current={isCurrent ? 'step' : undefined}
                            className={cn(
                                'text-xs',
                                isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground'
                            )}
                        >
                            <span aria-hidden="true">{index + 1}</span>
                            <span className="ms-1">{label}</span>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}
