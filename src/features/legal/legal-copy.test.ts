import { describe, expect, it } from 'vitest';

import ar from '../../../messages/ar/legal.json';
import en from '../../../messages/en/legal.json';
import { hardcodedCopy } from '../../../tests/helpers/hardcoded-copy';

/**
 * AR-024 — the legal extraction.
 *
 * The two legal pages were the last English copy on the public site. This
 * suite proves four things:
 *
 *   1. the SURFACE reads its copy from the catalog — the shared scanner
 *      fails on any English still written in the source;
 *   2. the ENGLISH did not change — the catalog carries, verbatim, the
 *      sentences the pages rendered before the extraction (the floor is a
 *      test, not a promise);
 *   3. the ARABIC is really Arabic — no value is a copy of its English
 *      counterpart, and nothing is empty;
 *   4. the PLACEHOLDERS survive the translation — the `[BRACKETED]` fields
 *      are fill-ins a lawyer will replace; an Arabic page that loses one
 *      is a page that quietly drops a legal field.
 */

/** The surface this batch owns. */
const SURFACE = [
    'src/app/[locale]/(marketing)/privacy/page.tsx',
    'src/app/[locale]/(marketing)/terms/page.tsx',
    'src/features/legal/components/legal-document.tsx',
];

/** The brand is a proper noun; it is not translated. */
const ALLOWED = ['AI Content Engine'];

/**
 * The English the pages rendered BEFORE the extraction (AR-024), verbatim.
 *
 * This is the regression floor in test form: if the catalog's English is
 * edited, this test fails and the edit has to be deliberate.
 */
const ENGLISH_FLOOR = {
    privacy: {
        meta: {
            title: 'Privacy Policy',
            description: 'How AI Content Engine handles account and usage data.',
        },
        title: 'Privacy Policy',
        notice: {
            title: 'Template — pending legal review.',
            body: 'This is a minimal placeholder so the footer link resolves. It is not a binding policy, and the bracketed fields below are fill-ins, not facts.',
        },
        sections: [
            {
                id: 'collect',
                heading: 'What we collect',
                body: 'Account details you provide (name, email address), the content you create in the product, and basic usage data needed to run the service and enforce plan quotas.',
            },
            {
                id: 'use',
                heading: 'How it is used',
                body: 'To operate your account, generate the assets you request, and keep the service secure. We do not sell personal data.',
            },
            {
                id: 'contact',
                heading: 'Contact',
                body: 'Questions about this policy: [CONTACT EMAIL].',
            },
        ],
        governing:
            'Governing entity: [COMPANY LEGAL NAME], [JURISDICTION]. Effective date: [DATE].',
    },
    terms: {
        meta: {
            title: 'Terms of Service',
            description: 'The terms for using AI Content Engine.',
        },
        title: 'Terms of Service',
        notice: {
            title: 'Template — pending legal review.',
            body: 'This is a minimal placeholder so the footer link resolves. Bracketed fields are fill-ins, not facts.',
        },
        sections: [
            {
                id: 'service',
                heading: 'The service',
                body: 'AI Content Engine generates creative assets (thumbnails, scripts, sound effects, images) for your video projects. You keep the rights to the content you create, subject to the provider terms that govern the generation models.',
            },
            {
                id: 'fairUse',
                heading: 'Fair use',
                body: 'Do not use the service to generate unlawful content or to attack the platform. Plan quotas are enforced per account.',
            },
            {
                id: 'contact',
                heading: 'Contact',
                body: 'Questions about these terms: [CONTACT EMAIL].',
            },
        ],
        governing:
            'Governing entity: [COMPANY LEGAL NAME], [JURISDICTION]. Effective date: [DATE].',
    },
} as const;

function flatten(value: unknown, prefix = ''): Record<string, string> {
    if (typeof value === 'string') return { [prefix]: value };
    if (value === null || typeof value !== 'object') return {};

    const out: Record<string, string> = {};
    for (const [key, child] of Object.entries(value)) {
        Object.assign(out, flatten(child, prefix ? `${prefix}.${key}` : key));
    }
    return out;
}

describe('the legal surface has no hardcoded copy', () => {
    for (const file of SURFACE) {
        it(`${file} reads its copy from the catalog`, () => {
            expect(hardcodedCopy(file, { allowed: ALLOWED })).toEqual([]);
        });
    }
});

describe('the English did not change', () => {
    it('carries the sentences the pages rendered before the extraction', () => {
        expect(en).toEqual(ENGLISH_FLOOR);
    });

    it('keeps the section order of both pages', () => {
        expect(en.privacy.sections.map((section) => section.id)).toEqual([
            'collect',
            'use',
            'contact',
        ]);
        expect(en.terms.sections.map((section) => section.id)).toEqual([
            'service',
            'fairUse',
            'contact',
        ]);
    });
});

describe('the Arabic is really Arabic', () => {
    const englishFlat = flatten(en);
    const arabicFlat = flatten(ar);

    it('has a value for every English key', () => {
        expect(Object.keys(arabicFlat).sort()).toEqual(Object.keys(englishFlat).sort());
    });

    it('differs from the English in every value', () => {
        // The section IDS are code (the code addresses a section by its id),
        // so they are the same in both languages — like the landing
        // assets' ids in AR-022.
        const identical = Object.keys(englishFlat).filter(
            (key) =>
                !key.endsWith('.id') && englishFlat[key] === arabicFlat[key]
        );
        expect(identical, 'these values were not translated').toEqual([]);
    });

    it('has no empty value', () => {
        const empty = Object.entries(arabicFlat)
            .filter(([, value]) => value.trim() === '')
            .map(([key]) => key);
        expect(empty).toEqual([]);
    });

    it('keeps every placeholder a lawyer has to fill in', () => {
        const placeholders = (value: string) => value.match(/\[[A-Z ]+\]/g) ?? [];
        for (const key of Object.keys(englishFlat)) {
            expect(
                placeholders(arabicFlat[key]).sort(),
                `${key} lost a placeholder`
            ).toEqual(placeholders(englishFlat[key]).sort());
        }
    });
});
