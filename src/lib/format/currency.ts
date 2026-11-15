import type { AppLocale } from '@/i18n/routing';

import { formatLocaleTag } from './locale';

/**
 * AR-013 — the currency formatter.
 *
 * The cents are a MACHINE value: the API stores cents, and the display
 * converts them. The value never changes with the locale — only the symbol
 * and its placement do ("$12" in English, "12 US$" in Arabic, which is what
 * the Arabic locale data says).
 */

/** An amount in cents as a currency string. */
export function formatCurrency(
    cents: number,
    currency: string,
    locale: AppLocale,
    fractionDigits = 0
): string {
    return new Intl.NumberFormat(formatLocaleTag(locale), {
        style: 'currency',
        currency: currency.toUpperCase(),
        maximumFractionDigits: fractionDigits,
    }).format(cents / 100);
}

/** An amount in cents as US dollars — the product's only currency today. */
export function formatUsd(cents: number, locale: AppLocale, fractionDigits = 0): string {
    return formatCurrency(cents, 'usd', locale, fractionDigits);
}
