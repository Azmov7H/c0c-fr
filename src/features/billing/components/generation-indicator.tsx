'use client';

import { useCredits, useBillingSummary } from '../hooks/use-billing';
import { quotaFor, usageFor } from '../lib/entitlements';

/**
 * P11.4 — the remaining-allowance indicator that sits on every generation
 * control.
 *
 * Server numbers only:
 *
 * - the remaining quota comes from `GET /billing/subscription`;
 * - the credit balance comes from `GET /billing/credits` (P08).
 *
 * A per-operation ESTIMATE is deliberately not shown: the server exposes
 * no per-operation estimate and the price table is still pending
 * Cost Analysis. Inventing one is exactly what the placeholder rule
 * forbids, so the indicator states what is known and stays silent about
 * what is not.
 */
export function GenerationIndicator({
    feature = 'ai.generation',
    className,
}: {
    feature?: string;
    className?: string;
}) {
    const billing = useBillingSummary();
    const credits = useCredits();

    const usage = usageFor(billing.data, feature);
    const limit = usage?.limit ?? quotaFor(billing.data, feature);
    // The server's own remaining count when it sent one.
    const remaining =
        usage?.remaining ?? (limit === null ? null : Math.max(0, limit - (usage?.used ?? 0)));
    const balance = credits.data?.balance ?? 0;

    const parts: string[] = [];
    if (remaining !== null) {
        parts.push(
            `${remaining} ${feature === 'ai.generation' ? 'generation' : feature} left this month`
        );
    } else {
        parts.push(`${feature} is unlimited`);
    }
    // A zero balance is not shown as "0 credits": while the monthly grant
    // is pending, zero means "not published", not "you have none".
    if (balance > 0) parts.push(`${balance} credits`);

    return (
        <p className={`text-xs text-muted-foreground ${className ?? ''}`} data-testid="generation-indicator">
            {parts.join(' · ')}
        </p>
    );
}
