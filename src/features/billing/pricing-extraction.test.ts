import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';

import enBilling from '../../../messages/en/billing.json';
import enPricing from '../../../messages/en/pricing.json';
import arBilling from '../../../messages/ar/billing.json';
import arPricing from '../../../messages/ar/pricing.json';
import { formatCurrency } from '@/lib/format';

import { hardcodedCopy } from '../../../tests/helpers/hardcoded-copy';
import { PLAN_CATALOGUE, PLAN_IDS } from './lib/plans';
import { buildPricingCopy, type PricingTranslator, type PlanCopy } from './lib/pricing-copy';

/**
 * AR-023 — the pricing extraction.
 *
 * The batch has three jobs, and this file proves each of them:
 *
 *   1. the plan catalogue is DATA again — its copy (the names, the audiences,
 *      the badge, the highlights, the FAQ, the comparison labels) lives in
 *      `messages/{locale}/pricing.json` and is read through the seam in
 *      `pricing-copy.ts`, so the same copy serves the server-rendered
 *      marketing page and the client-rendered app surfaces;
 *   2. the SURFACE has no hardcoded copy left — the shared scanner reads the
 *      files of the surface and fails on any English still written in them;
 *   3. the ARABIC is really Arabic — no catalog value is a copy of its
 *      English counterpart, nothing is empty, and the glossary's plan names
 *      are the ones the catalog uses.
 */

const REPO_ROOT = join(__dirname, '../../..');

/** The surface this batch owns. */
const SURFACE = [
    'src/app/[locale]/(marketing)/pricing/page.tsx',
    'src/features/billing/components/pricing.tsx',
    'src/features/billing/components/plan-chooser.tsx',
    'src/features/billing/lib/billing-state.ts',
    'src/features/billing/lib/plans.ts',
    'src/features/billing/lib/pricing-copy.ts',
];

/** The brand is a proper noun; Stripe is a product name. */
const ALLOWED = ['AI Content Engine', 'Stripe'];

/**
 * The values that legitimately read the same in both languages: the unit
 * glossary keeps `GB` in Latin script (GLOSSARY §2), so the storage template
 * is identical on purpose.
 */
const SAME_IN_BOTH_LANGUAGES = new Set(['{size} GB']);

const PRICING_CATALOGS = { en: enPricing, ar: arPricing } as const;

function pricingTranslator(locale: 'en' | 'ar'): PricingTranslator {
    return createTranslator({
        locale,
        messages: { pricing: PRICING_CATALOGS[locale] },
        namespace: 'pricing',
    }) as unknown as PricingTranslator;
}

function pricingCopy(locale: 'en' | 'ar') {
    return buildPricingCopy(pricingTranslator(locale));
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

describe('the pricing surface has no hardcoded copy', () => {
    for (const file of SURFACE) {
        it(`${file} reads its copy from the catalog`, () => {
            expect(hardcodedCopy(file, { allowed: ALLOWED })).toEqual([]);
        });
    }
});

describe('the plan catalogue is data', () => {
    it('defines the monthly list prices once', () => {
        expect(PLAN_CATALOGUE.starter.monthlyPriceCents).toBe(0);
        expect(PLAN_CATALOGUE.pro.monthlyPriceCents).toBe(4900);
        expect(PLAN_CATALOGUE.studio.monthlyPriceCents).toBe(19900);

        const copy = pricingCopy('en');
        expect(copy.monthlyPrice('starter', 'en')).toBe('Free');
        expect(copy.monthlyPrice('pro', 'en')).toBe('$49/month');
        expect(copy.monthlyPrice('studio', 'en')).toBe('$199/month');
    });

    it('does not carry copy in the code any more', () => {
        const source = readFileSync(
            join(REPO_ROOT, 'src/features/billing/lib/plans.ts'),
            'utf8'
        );
        // The fields that used to hold copy are gone from the type.
        expect(source).not.toMatch(/\bname\s*:\s*'[A-Z]/);
        expect(source).not.toMatch(/\baudience\s*:/);
        expect(source).not.toMatch(/recommendedLabel/);
        expect(source).not.toMatch(/PRICING_FAQ/);
        expect(source).not.toMatch(/FEATURE_LABELS|QUOTA_LABELS/);
    });

    it('mirrors the backend quota matrix', () => {
        expect(PLAN_CATALOGUE.starter.limits).toEqual({
            generations: 50,
            storageGB: 1,
            teamWorkspaces: 1,
            membersPerProject: 1,
            concurrentGenerations: 1,
        });
        expect(PLAN_CATALOGUE.pro.limits).toEqual({
            generations: 500,
            storageGB: 50,
            teamWorkspaces: 10,
            membersPerProject: 10,
            concurrentGenerations: 3,
        });
        expect(PLAN_CATALOGUE.studio.limits).toEqual({
            generations: 2000,
            storageGB: 500,
            teamWorkspaces: null,
            membersPerProject: null,
            concurrentGenerations: 10,
        });
    });

    it('does not advertise annual billing', () => {
        for (const id of PLAN_IDS) {
            expect(PLAN_CATALOGUE[id]).not.toHaveProperty('annualPriceCents');
        }
    });

    it('keeps public prices out of display components', () => {
        const files = [
            'src/features/billing/components/pricing.tsx',
            'src/features/landing/components/pricing-teaser.tsx',
            'src/features/settings/components/billing-settings.tsx',
        ];
        for (const file of files) {
            const source = readFileSync(join(REPO_ROOT, file), 'utf8');
            expect(source, `${file} hardcodes a dollar price`).not.toMatch(/\$\d{2,}/);
        }
    });
});

describe('the catalog carries the copy of every plan', () => {
    it('lists the plans in catalogue order, with the glossary names', () => {
        const copy = pricingCopy('en');
        expect(copy.plans().map((plan) => plan.id)).toEqual([...PLAN_IDS]);
        expect(copy.plans().map((plan) => plan.name)).toEqual([
            'Starter',
            'Pro',
            'Studio',
        ]);

        const arabic = pricingCopy('ar');
        expect(arabic.plans().map((plan) => plan.name)).toEqual([
            'انطلاق',
            'احترافي',
            'استوديو',
        ]);
    });

    it('keeps the catalogue and the catalog from drifting apart', () => {
        const copy = pricingCopy('en');
        const catalogIds = copy.plans().map((plan: PlanCopy) => plan.id);
        expect(new Set(catalogIds)).toEqual(new Set(PLAN_IDS));
        for (const id of PLAN_IDS) {
            expect(copy.plan(id).name).not.toBe('');
            expect(copy.plan(id).audience).not.toBe('');
        }
        // The badge is the recommended plan's, and only its.
        expect(copy.plan('pro').recommended).toBe('Recommended for weekly publishing');
        expect(copy.plan('starter').recommended).toBeUndefined();
        expect(copy.plan('studio').recommended).toBeUndefined();
    });

    it('renders the card copy the page used to hardcode', () => {
        const copy = pricingCopy('en');
        expect(copy.ctaLabel('starter')).toBe('Start free');
        expect(copy.ctaLabel('pro')).toBe('Choose Pro');
        expect(copy.highlights('studio', 'en')).toEqual([
            '2,000 AI generations per month',
            '500 GB storage',
            'Unlimited members per project',
            '10 generations at a time',
            'Advanced analytics',
            'Project export per download',
            'Priority generation queue',
            'Everything in Pro',
        ]);
        expect(copy.highlights('pro', 'en')).toContain('10 members per project');
        expect(copy.highlights('starter', 'en')).toContain('1 project export');
    });

    it('renders the comparison table the page used to hardcode', () => {
        const copy = pricingCopy('en');
        const rows = copy.comparison('en');
        expect(rows.map((row) => row.label)).toEqual([
            'AI generations',
            'Storage',
            'Team workspaces',
            'Project members',
            'Concurrent generations',
            'CSV export',
            'Invite collaborators',
            'Publish media',
            'Advanced analytics',
            'Priority generation queue',
        ]);
        expect(rows[0].values).toEqual({
            starter: '50 / month',
            pro: '500 / month',
            studio: '2,000 / month',
        });
        expect(rows[1].values.studio).toBe('500 GB');
        expect(rows[2].values.studio).toBe('Unlimited');
        expect(rows[3].values.starter).toBe('1');
        expect(rows[4].values.pro).toBe('3');
        expect(rows[5].values.starter).toBe('1 per project');
        expect(rows[5].values.pro).toBe('Per export');
        expect(rows[6].values.starter).toBe('Included');
        expect(rows[8].values.starter).toBe('Not included');
    });

    it('renders the FAQ the page used to hardcode', () => {
        const faq = pricingCopy('en').faq('en');
        expect(faq).toHaveLength(5);
        expect(faq[0]).toMatchObject({
            id: 'try',
            question: 'Do I need a plan to try the product?',
        });
        expect(faq.map((item) => item.id)).toEqual([
            'try',
            'quota',
            'cancel',
            'refunds',
            'annual',
        ]);
        for (const item of faq) {
            expect(item.question).not.toBe('');
            expect(item.answer).not.toBe('');
        }
        // The Starter quota in the answer is DATA: it comes from the
        // catalogue, so raising the quota changes the sentence and no copy
        // edit can make the FAQ lie.
        expect(faq[0].answer).toContain(
            `${PLAN_CATALOGUE.starter.limits.generations} AI generations`
        );
        expect(pricingCopy('en').faq('ar')[0].answer).toContain(
            String(PLAN_CATALOGUE.starter.limits.generations)
        );
    });

    it('renders the price in the locale of the visitor', () => {
        const copy = pricingCopy('ar');
        expect(copy.monthlyPrice('starter', 'ar')).toBe('مجاني');
        expect(copy.monthlyPrice('pro', 'ar')).toBe(
            `${formatCurrency(4900, 'usd', 'ar')} شهريًا`
        );
        // Arabic selects the six-form plural from the raw count (AR-D-04),
        // and the number it displays is the format layer's.
        expect(copy.highlights('pro', 'ar')).toContain('3 عمليات توليد في الوقت نفسه');
        expect(copy.highlights('pro', 'ar')).toContain('10 أعضاء لكل مشروع');
    });
});

describe('the Arabic is really Arabic', () => {
    const pairs: Array<[string, unknown, unknown]> = [
        ['pricing', enPricing, arPricing],
        ['billing', enBilling, arBilling],
    ];

    for (const [namespace, english, arabic] of pairs) {
        it(`${namespace}: every Arabic value differs from its English counterpart`, () => {
            const englishFlat = flatten(english);
            const arabicFlat = flatten(arabic);

            const identical = Object.keys(englishFlat).filter(
                (key) =>
                    typeof englishFlat[key] === 'string' &&
                    englishFlat[key] === arabicFlat[key] &&
                    !SAME_IN_BOTH_LANGUAGES.has(String(englishFlat[key])) &&
                    !ALLOWED.some((allowed) => String(englishFlat[key]).includes(allowed))
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

    it('uses the glossary plan names in the Arabic catalog', () => {
        const names = pricingCopy('ar').plans().map((plan) => plan.name);
        expect(names).toEqual(['انطلاق', 'احترافي', 'استوديو']);
    });
});
