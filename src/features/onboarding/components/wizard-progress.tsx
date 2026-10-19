'use client';

import * as React from 'react';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

import { FINISH_LABEL } from '../lib/onboarding-schemas';

interface WizardProgressProps {
    /** Zero-based index of the current step. */
    current: number;
    total: number;
    /** Step labels from the API taxonomy (may be shorter than `total`). */
    labels?: string[];
}

/**
 * Position and total, in words and as a bar.
 *
 * The last stop reads "Finish" rather than "Step 6" (card §4) — it is a
 * confirmation, not another question. `aria-current="step"` marks the active
 * item for screen readers.
 */
export function WizardProgress({ current, total, labels }: WizardProgressProps) {
    const lastIndex = total - 1;
    const currentLabel = current === lastIndex ? FINISH_LABEL : labels?.[current] ?? `Step ${current + 1}`;

    return (
        <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-4">
                <p className="text-sm font-medium" aria-live="polite">
                    {current === lastIndex ? (
                        FINISH_LABEL
                    ) : (
                        <>
                            {`Step ${current + 1} of ${total}`}
                            <span className="text-muted-foreground"> · {currentLabel}</span>
                        </>
                    )}
                </p>
                <p className="text-xs text-muted-foreground">{current + 1}/{total}</p>
            </div>

            <Progress
                value={((current + 1) / total) * 100}
                aria-label={`Onboarding progress: step ${current + 1} of ${total}`}
            />

            <ol className="flex flex-wrap gap-x-3 gap-y-1">
                {Array.from({ length: total }).map((_, index) => {
                    const isCurrent = index === current;
                    const label = index === lastIndex ? FINISH_LABEL : labels?.[index] ?? `Step ${index + 1}`;
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
                            <span className="ml-1">{label}</span>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}
