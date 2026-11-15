/**
 * AR-012 — the i18n lint allowlist.
 *
 * The two i18n lint rules (`no-hardcoded-locale`, `no-locale-equality`) read
 * this file and exempt the paths listed below. The rules are deliberately
 * blunt: a hardcoded locale or a locale comparison is a bug waiting for the
 * second locale, so the ONLY way to keep one is to list the file here, with
 * a reason, and to take the entry off again when the file is migrated.
 *
 * The list is read as text (the lint rule cannot evaluate TypeScript), so
 * every entry is a quoted path.
 *
 * ─── The debt this list carries ────────────────────────────────────────────
 *
 * AR-014 migrated every formatter site onto `src/lib/format/`, so the list
 * is down to the two places where a hardcoded locale is honest by design:
 * the planner's time-zone detection (an INPUT to the formatter) and the
 * direction helpers (a direction decision, not a word).
 */
export const HARDCODED_LOCALE_EXCEPTIONS: string[] = [
    // Not a display formatter: the planner reads the environment's time zone
    // (FORMATTING-STRATEGY §2). The time zone is an input to the formatter,
    // never inferred from the locale.
    'src/features/planner/services/planner.service.ts',
    // The direction helpers live here — a direction decision is not copy, so
    // it is not a catalog key.
    'src/i18n/routing.ts',
];

/**
 * Places where a locale comparison is honest and cannot be expressed as a
 * translation.
 *
 * A locale comparison is a smell for ONE reason: it usually picks between
 * two pieces of COPY, and copy belongs in a catalog. It is legitimate in
 * exactly two cases — a DIRECTION decision (which is not copy) and a
 * technical switch (a number system, a formatting rule). Both live here, in
 * one file, so the set of locale comparisons in the codebase is countable.
 */
export function isArabic(locale: string): boolean {
    return locale === 'ar';
}

/** The writing direction of a locale — not copy, so not a catalog key. */
export function directionOf(locale: string): 'ltr' | 'rtl' {
    return locale === 'ar' ? 'rtl' : 'ltr';
}
