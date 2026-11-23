'use client';

import { useLocale } from 'next-intl';

import { formatCredits } from '@/lib/format';
import { cn } from '@/lib/utils';

/**
 * Tabular-numeric money/credit formatting (spec §7.2, `Money`/`CreditAmount`).
 *
 * The locale comes from the format layer (`src/lib/format` — `formatCredits`,
 * AR-013; `useLocale` supplies the locale — AR-014). Credits are integers in
 * the admin API surface; both formatters render zero-fraction tabular
 * numerals.
 *
 * `Money` is the generic currency form (grouping, unsigned); `CreditAmount`
 * is the signed credit form with kind color.
 */

export function Money({ value, className }: { value: number; className?: string }) {
    const locale = useLocale();
    return (
        <span className={cn('font-mono tabular-nums', className)}>
            {formatCredits(value, locale)}
        </span>
    );
}

export type CreditAmountKind =
    | 'grant'
    | 'refund'
    | 'settle'
    | 'release'
    | 'topup'
    | 'expiry'
    | 'generic';

/** Signed credit amount with kind color (spec §7.2, `CreditAmount`). */
export function CreditAmount({
    value,
    kind = 'generic',
}: {
    value: number;
    kind?: CreditAmountKind;
}) {
    const locale = useLocale();
    const negative = value < 0;
    const sign = negative ? '-' : value > 0 ? '+' : '';
    const magnitude = negative ? -value : value;
    const color =
        kind === 'refund' || kind === 'grant'
            ? 'text-success'
            : kind === 'settle'
              ? negative
                ? 'text-destructive'
                : 'text-foreground'
              : negative
                ? 'text-destructive'
                : 'text-muted-foreground';
    return (
        <span className={cn('font-mono tabular-nums', color)}>
            {sign}
            {formatCredits(magnitude, locale)}
        </span>
    );
}
