// TYPE-ONLY: this module is imported by server components as well, and
// `useTranslations` is a client hook. The import is erased at compile
// time, so the seam stays usable on both sides of the server/client
// line — and the translator's type still comes from next-intl's own
// definition, so a key that does not exist is a TYPE ERROR.
import type { useTranslations } from 'next-intl';

import type { AppLocale } from '@/i18n/routing';
import { formatCurrency, formatNumber } from '@/lib/format';

import type { PlanId } from '../types';
import { PLAN_CATALOGUE, PLAN_IDS } from './plans';

/**
 * AR-023 — the pricing copy.
 *
 * The plan catalogue holds the DATA (the ids, the prices, the limits, the
 * features); the catalog holds the COPY (the names, the audiences, the
 * sentences). This module is the SEAM between them: it turns one into the
 * other, so that
 *
 *   - a sentence is never composed in code — a sentence composed in code is
 *     a sentence that stays English in `/ar`;
 *   - the marketing surface (server-rendered, no client runtime) and the app
 *     surface (client components, a `NextIntlClientProvider`) read the SAME
 *     copy, through the same functions.
 *
 * The translator is next-intl's own type, so a key that does not exist in
 * the catalog is a TYPE ERROR, not a runtime surprise.
 */
export type PricingTranslator = ReturnType<typeof useTranslations<'pricing'>>;

/** One plan, as the catalog describes it. */
export interface PlanCopy {
    id: PlanId;
    name: string;
    audience: string;
    /** The badge the recommended plan carries — the other plans have none. */
    recommended?: string;
}

/** One row of the comparison table. */
export interface ComparisonRow {
    label: string;
    values: Record<PlanId, string>;
}

export interface PricingFaqItem {
    id: string;
    question: string;
    answer: string;
}

export interface PricingCopy {
    /** Every plan, in catalogue order. */
    plans(): PlanCopy[];
    /** One plan's copy. */
    plan(plan: PlanId): PlanCopy;
    /** The plan's display name. */
    planName(plan: PlanId): string;
    /** "Free" or "$49/month" — the price and its unit are the catalog's. */
    monthlyPrice(plan: PlanId, locale: AppLocale): string;
    /** The plan card's call to action. */
    ctaLabel(plan: PlanId): string;
    /** A quota's label. */
    quotaLabel(feature: string): string;
    /** The quota ids, in the order the usage summary lists them. */
    quotaOrder(): string[];
    /** A limit as a display string — the number, or "Unlimited". */
    limit(value: number | null, locale: AppLocale): string;
    /** The plan card's bullet list. */
    highlights(plan: PlanId, locale: AppLocale): string[];
    /** The comparison table's rows. */
    comparison(locale: AppLocale): ComparisonRow[];
    /** The pricing page's FAQ. */
    faq(locale: AppLocale): PricingFaqItem[];
}

/**
 * The comparison table's rows.
 *
 * The ORDER and the VALUES are code (a table is a data structure); the LABEL
 * of every row is copy, and the catalog owns it. The rows that used to read
 * their label from the feature vocabulary keep their feature id here — the
 * test asserts that every capability the backend enforces has a row.
 */
const COMPARISON_ROWS = [
    { id: 'generations', kind: 'generations', feature: 'ai.generation' },
    { id: 'storage', kind: 'storage', feature: null },
    { id: 'workspaces', kind: 'workspaces', feature: 'teams.create' },
    { id: 'members', kind: 'members', feature: 'project.members' },
    { id: 'concurrent', kind: 'concurrent', feature: null },
    { id: 'export', kind: 'export', feature: 'export.csv' },
    { id: 'invite', kind: 'feature', feature: 'teams.invite' },
    { id: 'publish', kind: 'feature', feature: 'media.publish' },
    { id: 'analytics', kind: 'feature', feature: 'analytics.advanced' },
    { id: 'priority', kind: 'feature', feature: 'priority_queue' },
] as const;

/** The plan's price, without its unit — the unit is the catalog's. */
function priceAmount(plan: PlanId, locale: AppLocale): string {
    const definition = PLAN_CATALOGUE[plan];
    return formatCurrency(definition.monthlyPriceCents, definition.currency, locale);
}

/**
 * Builds the copy from a translator.
 *
 * The translator is bound to the `pricing` namespace, so every key below is
 * `pricing.<key>`.
 */
export function buildPricingCopy(t: PricingTranslator): PricingCopy {
    const planItems = t.raw('plans') as PlanCopy[];
    const quotaItems = t.raw('quota') as { id: string; label: string }[];
    const comparisonRows = t.raw('comparison.rows') as { id: string; label: string }[];

    const planById = new Map(planItems.map((item) => [item.id, item]));
    const quotaById = new Map(quotaItems.map((item) => [item.id, item.label]));
    const comparisonById = new Map(comparisonRows.map((row) => [row.id, row.label]));

    /** A plan's copy, with the catalogue's plan as the fallback. */
    const planCopy = (plan: PlanId): PlanCopy =>
        planById.get(plan) ?? {
            id: plan,
            name: plan,
            audience: '',
        };

    const copy: PricingCopy = {
        plans: () => planItems,

        plan: planCopy,

        planName: (plan) => planCopy(plan).name,

        monthlyPrice: (plan, locale) => {
            const definition = PLAN_CATALOGUE[plan];
            return definition.monthlyPriceCents === 0
                ? t('price.free')
                : t('price.perMonth', { price: priceAmount(plan, locale) });
        },

        ctaLabel: (plan) =>
            plan === 'starter'
                ? t('cta.startFree')
                : t('cta.choose', { plan: planCopy(plan).name }),

        quotaLabel: (feature) => quotaById.get(feature) ?? feature,

        quotaOrder: () => quotaItems.map((item) => item.id),

        limit: (value, locale) =>
            value === null ? t('limit.unlimited') : formatNumber(value, locale),

        highlights: (plan, locale) => {
            const definition = PLAN_CATALOGUE[plan];
            const { generations, storageGB, membersPerProject, concurrentGenerations } =
                definition.limits;
            const highlights: string[] = [
                // AR-D-04 / FORMATTING-STRATEGY §5: every displayed number
                // comes from the app's format layer, so a message never
                // embeds a number in the wrong numeral system. The two
                // plural templates below go further: `count` selects the
                // branch (raw) and `value` is what the reader sees
                // (formatted).
                t('highlight.generations', {
                    count: formatNumber(generations, locale),
                }),
                t('highlight.storage', { size: storageGB }),
                membersPerProject === null
                    ? t('highlight.unlimitedMembers')
                    : t('highlight.members', {
                          count: membersPerProject,
                          value: formatNumber(membersPerProject, locale),
                      }),
                t('highlight.concurrent', {
                    count: concurrentGenerations,
                    value: formatNumber(concurrentGenerations, locale),
                }),
            ];

            if (definition.features.includes('analytics.advanced')) {
                highlights.push(t('highlight.advancedAnalytics'));
            }
            if (definition.features.includes('export.csv')) {
                // P09.2: Free exports ONCE per project; paid plans export
                // per export (priced). Saying "CSV export" for both would be
                // a lie — so the two sentences are different.
                highlights.push(
                    definition.monthlyPriceCents === 0
                        ? t('highlight.freeExport')
                        : t('highlight.paidExport')
                );
            }
            if (definition.features.includes('priority_queue')) {
                highlights.push(t('highlight.priorityQueue'), t('highlight.everythingInPro'));
            }

            return highlights;
        },

        comparison: (locale) =>
            COMPARISON_ROWS.map((row) => {
                const label = comparisonById.get(row.id) ?? row.id;
                const values = {} as Record<PlanId, string>;

                for (const plan of PLAN_IDS) {
                    const definition = PLAN_CATALOGUE[plan];
                    values[plan] = ((): string => {
                        switch (row.kind) {
                            case 'generations':
                                return t('limit.perMonth', {
                                    count: formatNumber(definition.limits.generations, locale),
                                });
                            case 'storage':
                                return t('limit.storage', { size: definition.limits.storageGB });
                            case 'workspaces':
                                return copy.limit(definition.limits.teamWorkspaces, locale);
                            case 'members':
                                return copy.limit(definition.limits.membersPerProject, locale);
                            case 'concurrent':
                                return String(definition.limits.concurrentGenerations);
                            case 'export':
                                // P09.2/P09.3: the export row is not a
                                // boolean — Free gets one export per project,
                                // paid plans are priced per export.
                                return definition.monthlyPriceCents === 0
                                    ? t('limit.onePerProject')
                                    : t('limit.perExport');
                            case 'feature':
                                return definition.features.includes(row.feature)
                                    ? t('limit.included')
                                    : t('limit.notIncluded');
                        }
                    })();
                }

                return { label, values };
            }),

        faq: (locale) => [
            {
                id: 'try',
                question: t('faq.try.question'),
                answer: t('faq.try.answer', {
                    // The Starter quota is DATA, and a count in a sentence is
                    // the format layer's (`50`, never a literal in the copy).
                    count: formatNumber(PLAN_CATALOGUE.starter.limits.generations, locale),
                }),
            },
            { id: 'quota', question: t('faq.quota.question'), answer: t('faq.quota.answer') },
            { id: 'cancel', question: t('faq.cancel.question'), answer: t('faq.cancel.answer') },
            {
                id: 'refunds',
                question: t('faq.refunds.question'),
                answer: t('faq.refunds.answer'),
            },
            { id: 'annual', question: t('faq.annual.question'), answer: t('faq.annual.answer') },
        ],
    };

    return copy;
}
