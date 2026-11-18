'use client';

import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { MappedAuthError } from '../lib/auth-error-map';

/**
 * Inline submit-error display with reserved space: the container always
 * occupies one alert's height, so a normal error appearing/disappearing does
 * not move the submit button (T12 "no layout shift on error"). The rare 5xx
 * reference line is the one case that can add height — it is worth the shift
 * for support traceability.
 */
export function AuthErrorAlert({ error }: { error: MappedAuthError | null }) {
    // AR-026: the message is the catalog's; an upstream excerpt is DATA and
    // is shown as it arrived.
    const t = useTranslations('auth');

    return (
        <div className="min-h-[3rem]" data-testid="auth-error-slot">
            {error ? (
                <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <div>
                        <p>{error.excerpt ?? t(`errors.${error.messageKey}`)}</p>
                        {error.reference ? (
                            <p className="mt-1 text-xs opacity-80">
                                {t('errors.reference', { reference: error.reference })}
                            </p>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
