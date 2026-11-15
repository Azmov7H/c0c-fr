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
 * The formatter sites below still format with a hardcoded locale. They are
 * the ones FORMATTING-STRATEGY §2 maps, and they are migrated in AR-014,
 * when `src/lib/format/` exists and every call goes through it. Until then
 * they are the KNOWN exceptions — one line each, one owner (the format
 * layer), one deadline (AR-014).
 */
export const HARDCODED_LOCALE_EXCEPTIONS: string[] = [
    // AR-014 — the centralized format layer.
    'src/lib/relative-time.ts',
    'src/features/dashboard/lib/format.ts',
    'src/features/dashboard/components/dashboard-widgets.tsx',
    'src/features/billing/lib/format.ts',
    'src/features/billing/lib/plans.ts',
    'src/features/planner/components/content-planner.tsx',
    'src/components/ui/calendar.tsx',
    'src/components/ui/chart.tsx',
    'src/features/projects/components/workspace/project-export.tsx',
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
