import type { AppLocale } from '@/i18n/routing';

import { formatLocaleTag } from './locale';

/**
 * AR-013 — the credit formatter.
 *
 * Credits are integers: the API returns raw integers and the display adds
 * the grouping. The sign and the grouping are display-only; the machine
 * value stays an integer (FORMATTING-STRATEGY §6).
 */

export function formatCredits(value: number, locale: AppLocale): string {
    return new Intl.NumberFormat(formatLocaleTag(locale), {
        maximumFractionDigits: 0,
    }).format(value);
}
