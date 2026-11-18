'use client';

import { Check, Circle } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { passwordChecks, passwordScore, PASSWORD_MIN_LENGTH } from '@/lib/password-policy';
import { cn } from '@/lib/utils';

/**
 * Real strength feedback backed by the shared policy object
 * (`src/lib/password-policy.ts`) — the same checks the zod schema enforces,
 * so the meter can never mark a password valid that the API will reject.
 */
export function PasswordStrengthMeter({ value }: { value: string }) {
    // AR-026: the checklist's labels are copy (the checks themselves are code).
    const t = useTranslations('auth');
    if (!value) return null;

    const score = passwordScore(value);
    const barColor =
        score >= 4 ? 'bg-success' : score === 3 ? 'bg-info' : score === 2 ? 'bg-warning' : 'bg-destructive';

    return (
        <div className="space-y-2" data-testid="password-strength-meter" aria-live="polite">
            <div
                className="flex gap-1"
                role="img"
                aria-label={t('password.strengthAria', {
                    score,
                    total: passwordChecks.length,
                })}
            >
                {passwordChecks.map((check, index) => (
                    <span
                        key={check.id}
                        className={cn(
                            'h-1.5 flex-1 rounded-full transition-colors',
                            index < score ? barColor : 'bg-muted'
                        )}
                    />
                ))}
            </div>
            <ul className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
                {passwordChecks.map((check) => {
                    const met = check.test(value);
                    return (
                        <li
                            key={check.id}
                            className={cn(
                                'flex items-center gap-1.5 text-xs',
                                met ? 'text-foreground' : 'text-muted-foreground'
                            )}
                        >
                            {met ? (
                                <Check className="h-3 w-3 shrink-0 text-success" aria-hidden="true" />
                            ) : (
                                <Circle className="h-3 w-3 shrink-0" aria-hidden="true" />
                            )}
                            {t(`password.checks.${check.id}`, {
                                count: PASSWORD_MIN_LENGTH,
                            })}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
