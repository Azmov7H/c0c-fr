import type { AppLocale } from '@/i18n/routing';

import { formatLocaleTag } from './locale';

/**
 * AR-013 — the file-size formatter.
 *
 * Binary-ish units, exactly as today: the server counts bytes and the client
 * only labels them. The unit abbreviations stay Latin — they are technical
 * shorthand, not copy — while the NUMBER follows the numeral policy (Latin
 * digits in both locales, AR-D-04).
 */

const UNITS = ['B', 'KB', 'MB', 'GB'];

export function formatFileSize(bytes: number, locale: AppLocale): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return `0 ${UNITS[0]}`;
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < UNITS.length - 1) {
        value /= 1024;
        unit += 1;
    }
    const rounded = value >= 10 || unit === 0 ? Math.round(value) : Math.round(value * 10) / 10;
    const number = new Intl.NumberFormat(formatLocaleTag(locale), {
        maximumFractionDigits: 1,
    }).format(rounded);
    return `${number} ${UNITS[unit]}`;
}
