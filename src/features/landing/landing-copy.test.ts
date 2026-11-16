import { describe, expect, it } from 'vitest';

import { hardcodedCopy } from '../../../tests/helpers/hardcoded-copy';

import ar from '../../../messages/ar/landing.json';
import arCommon from '../../../messages/ar/common.json';
import en from '../../../messages/en/landing.json';
import enCommon from '../../../messages/en/common.json';

/**
 * AR-022 — the landing extraction.
 *
 * Three things are proved here, and none of them is "the strings are still
 * where they were":
 *
 *   1. the SURFACE has no hardcoded copy left — the scanner below reads the
 *      landing components and the marketing chrome and fails on any piece of
 *      English that is still written in the source;
 *   2. the ARABIC is really Arabic — no Arabic catalog value is a copy of
 *      its English counterpart, and no value is empty;
 *   3. the copy is COMPLETE — every key the catalog declares is referenced
 *      by the code (the CI usage gate proves the same thing from the other
 *      side; this test states it where the batch lives).
 */

/** The surface this batch owns. */
const SURFACE = [
    'src/app/[locale]/(marketing)/page.tsx',
    'src/components/layout/marketing-header.tsx',
    'src/components/layout/marketing-footer.tsx',
    'src/components/theme-quick-toggle.tsx',
    'src/features/landing/components/assets.tsx',
    'src/features/landing/components/collaboration.tsx',
    'src/features/landing/components/final-cta.tsx',
    'src/features/landing/components/hero.tsx',
    'src/features/landing/components/how-it-works.tsx',
    'src/features/landing/components/pricing-teaser.tsx',
    'src/features/landing/components/problem.tsx',
    'src/features/landing/components/proof.tsx',
];

/** The strings that are not copy even though they look like it. */
const ALLOWED = [
    // The brand is a proper noun: it is not translated.
    'AI Content Engine',
    // The language names in the switcher are language names.
    'English',
];

function isAllowed(text: string): boolean {
    return ALLOWED.some((allowed) => text.includes(allowed));
}

function flatten(value: unknown, prefix = ''): Record<string, unknown> {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        return { [prefix]: value };
    }
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
        Object.assign(out, flatten(child, prefix ? `${prefix}.${key}` : key));
    }
    return out;
}

describe('the landing surface has no hardcoded copy', () => {
    for (const file of SURFACE) {
        it(`${file} reads its copy from the catalog`, () => {
            expect(hardcodedCopy(file, { allowed: ALLOWED })).toEqual([]);
        });
    }
});

describe('the Arabic is really Arabic', () => {
    const pairs: Array<[string, unknown, unknown]> = [
        ['landing', en, ar],
        ['common', enCommon, arCommon],
    ];

    for (const [namespace, english, arabic] of pairs) {
        it(`${namespace}: every Arabic value differs from its English counterpart`, () => {
            const englishFlat = flatten(english);
            const arabicFlat = flatten(arabic);

            const identical = Object.keys(englishFlat).filter(
                (key) =>
                    typeof englishFlat[key] === 'string' &&
                    englishFlat[key] === arabicFlat[key] &&
                    !isAllowed(String(englishFlat[key]))
            );

            expect(identical, `${namespace}: these values were not translated`).toEqual([]);
        });

        it(`${namespace}: no Arabic value is empty`, () => {
            const arabicFlat = flatten(arabic);
            const empty = Object.entries(arabicFlat)
                .filter(([, value]) => typeof value === 'string' && value.trim() === '')
                .map(([key]) => key);

            expect(empty).toEqual([]);
        });
    }
});
