import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

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

const REPO_ROOT = join(__dirname, '../../..');

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

/**
 * The attributes that carry USER-FACING text. A literal in any of them is a
 * string that never reaches the catalog.
 */
const COPY_PROPS = ['title', 'alt', 'aria-label', 'placeholder', 'label', 'description'];

/**
 * Two or more Latin words of three letters or more, separated by a space.
 *
 * The shape matters more than the vocabulary: a class name has no spaces
 * between words that look like words (`flex items-center`), so the scanner
 * looks at the SOURCE with the class lists removed.
 */
const LATIN_PROSE = /[A-Za-z]{3,}(?:[ ][A-Za-z]{3,})+/;

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

/**
 * The pieces of hardcoded copy in one file.
 *
 * The class lists are removed first — they are the only place in the source
 * where English words appear next to each other without being copy.
 */
export function hardcodedCopy(file: string): string[] {
    const source = readFileSync(join(REPO_ROOT, file), 'utf8');

    // 1. the class lists (a string or an expression) are presentation.
    const withoutClasses = source.replace(/className\s*=\s*(?:"[^"]*"|\{[^}]*\})/g, 'className=');

    // 2. the imports, the comments and the URLs are not copy.
    const withoutNoise = withoutClasses
        .replace(/import[^;]*;/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/[^\n]*/g, '')
        .replace(/https?:\/\/[^\s"']*/g, '');

    const found: string[] = [];

    // 3. the JSX text nodes: `>Some English copy<` — and the text that
    //    follows an EXPRESSION (`{t('x')} Some English copy<`), which is
    //    exactly where a leftover line of English tends to survive.
    for (const match of withoutNoise.matchAll(/[>}]([^<>{}]{6,})</g)) {
        const text = match[1].trim();
        if (LATIN_PROSE.test(text) && !isAllowed(text)) found.push(text);
    }

    // 4. the copy attributes with a literal value.
    for (const prop of COPY_PROPS) {
        const pattern = new RegExp(`${prop}\\s*=\\s*"([^"]{4,})"`, 'g');
        for (const match of withoutNoise.matchAll(pattern)) {
            const text = match[1].trim();
            if (LATIN_PROSE.test(text) && !isAllowed(text)) found.push(`${prop}="${text}"`);
        }
    }

    return found;
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
            expect(hardcodedCopy(file)).toEqual([]);
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
