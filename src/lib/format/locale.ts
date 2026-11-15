import type { AppLocale } from '@/i18n/routing';

/**
 * AR-013 — the locale tags the format layer uses.
 *
 * The interface locale and the display locale are not the same thing: `en`
 * is the app's locale, `en-US` is the display locale its users see today.
 * Keeping the mapping in one place is what makes "the English output does
 * not change" a property of the code rather than a coincidence.
 *
 * `ar` carries the `latn` numbering system (AR-D-04): Latin digits for
 * every displayed number, in Arabic as well as in English. The interface
 * language stays decoupled from numeral presentation — a documented product
 * setting, not a locale accident — and the credit ledger stays copy-pasteable
 * and comparable with the Stripe dashboard.
 */
export const FORMAT_LOCALE_TAGS: Record<AppLocale, string> = {
    en: 'en-US',
    ar: 'ar-u-nu-latn',
};

/** The display locale tag for an app locale. */
export function formatLocaleTag(locale: AppLocale): string {
    return FORMAT_LOCALE_TAGS[locale] ?? FORMAT_LOCALE_TAGS.en;
}

/**
 * The base options every date formatter uses.
 *
 * The Gregorian calendar is declared explicitly (FORMATTING-STRATEGY §4):
 * the calendar a user sees must never depend on the ICU default of the
 * locale, and the Arabic default of some environments is the Hijri one.
 *
 * The hour cycle is declared too, for the same reason: `en` keeps the 12-hour
 * cycle it has always used, and `ar` keeps the 12-hour cycle its own locale
 * data uses — both stated in code rather than inherited from an ambient
 * default that can change with an ICU upgrade.
 */
export const BASE_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
    calendar: 'gregory',
    hour12: true,
};
