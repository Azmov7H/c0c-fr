import type { AppLocale } from '@/i18n/routing';
import { formatNumber } from '@/lib/format';

import type { BillingFeature, PlanId } from '../types';

export interface PlanLimits {
    generations: number;
    storageGB: number;
    teamWorkspaces: number | null;
    membersPerProject: number | null;
    concurrentGenerations: number;
}

/**
 * AR-023 — a plan is DATA.
 *
 * The name, the audience and the badge are COPY, and copy lives in the
 * catalog (`messages/{locale}/pricing.json`); the code reaches it through
 * `pricing-copy.ts`. What is left here is what a plan really is: what it
 * costs, what it allows and what it enforces.
 *
 * The ids stay in the code — they travel in the API, in the URLs and in the
 * database, and they are never translated (GLOSSARY §2).
 */
export interface PlanDefinition {
    id: PlanId;
    monthlyPriceCents: number;
    currency: 'usd';
    limits: PlanLimits;
    features: readonly BillingFeature[];
}

export const PLAN_IDS: readonly PlanId[] = ['starter', 'pro', 'studio'];

export const PLAN_CATALOGUE: Record<PlanId, PlanDefinition> = {
    starter: {
        id: 'starter',
        monthlyPriceCents: 0,
        currency: 'usd',
        limits: {
            generations: 50,
            storageGB: 1,
            teamWorkspaces: 1,
            membersPerProject: 1,
            concurrentGenerations: 1,
        },
        features: [
            'ai.generation',
            'teams.create',
            'teams.invite',
            'media.publish',
            'project.members',
            // P09.2: the Free tier CAN export — once per project. The
            // quantity is the plan's business, not a missing capability.
            'export.csv',
        ],
    },
    pro: {
        id: 'pro',
        monthlyPriceCents: 4900,
        currency: 'usd',
        limits: {
            generations: 500,
            storageGB: 50,
            teamWorkspaces: 10,
            membersPerProject: 10,
            concurrentGenerations: 3,
        },
        features: [
            'ai.generation',
            'teams.create',
            'teams.invite',
            'media.publish',
            'project.members',
            'analytics.advanced',
            'export.csv',
        ],
    },
    studio: {
        id: 'studio',
        monthlyPriceCents: 19900,
        currency: 'usd',
        limits: {
            generations: 2000,
            storageGB: 500,
            teamWorkspaces: null,
            membersPerProject: null,
            concurrentGenerations: 10,
        },
        features: [
            'ai.generation',
            'teams.create',
            'teams.invite',
            'media.publish',
            'project.members',
            'priority_queue',
            'analytics.advanced',
            'export.csv',
        ],
    },
};

/**
 * AR-023 — the limit as a NUMBER, or null when the plan does not cap it.
 *
 * "Unlimited" is copy (the catalog's `limit.unlimited`), so this function
 * only ever deals with numbers: the copy module turns the null into the
 * word.
 */
export function limitValue(value: number | null, locale: AppLocale): string | null {
    return value === null ? null : formatNumber(value, locale);
}

export function planRank(plan: PlanId): number {
    return PLAN_IDS.indexOf(plan);
}

export function isPaidPlan(plan: PlanId): boolean {
    return PLAN_CATALOGUE[plan].monthlyPriceCents > 0;
}

export function nextPlan(plan: PlanId, direction: 'upgrade' | 'downgrade'): PlanId | null {
    const index = planRank(plan);
    const target = direction === 'upgrade' ? index + 1 : index - 1;
    return PLAN_IDS[target] ?? null;
}
