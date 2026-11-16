import { describe, expect, it } from 'vitest';

import {
    PLAN_CATALOGUE,
    PLAN_IDS,
    isPaidPlan,
    nextPlan,
    planRank,
} from './plans';

/**
 * AR-023 — the plan catalogue is DATA.
 *
 * The copy moved to `messages/{locale}/pricing.json` and is read through
 * `pricing-copy.ts` (see `pricing-extraction.test.ts`, which owns the copy
 * and the extraction gates). This suite pins what is left in the code: the
 * prices, the limits, the ranks and the capability matrix.
 */
describe('plan catalogue', () => {
    it('defines the monthly list prices once', () => {
        expect(PLAN_CATALOGUE.starter.monthlyPriceCents).toBe(0);
        expect(PLAN_CATALOGUE.pro.monthlyPriceCents).toBe(4900);
        expect(PLAN_CATALOGUE.studio.monthlyPriceCents).toBe(19900);
        for (const id of PLAN_IDS) expect(PLAN_CATALOGUE[id].currency).toBe('usd');
    });

    it('keeps the plan order the upgrade path depends on', () => {
        expect(PLAN_IDS).toEqual(['starter', 'pro', 'studio']);
        expect(planRank('starter')).toBe(0);
        expect(planRank('pro')).toBe(1);
        expect(planRank('studio')).toBe(2);
        expect(nextPlan('starter', 'upgrade')).toBe('pro');
        expect(nextPlan('pro', 'upgrade')).toBe('studio');
        expect(nextPlan('studio', 'upgrade')).toBeNull();
        expect(nextPlan('starter', 'downgrade')).toBeNull();
        expect(nextPlan('studio', 'downgrade')).toBe('pro');
    });

    it('knows which plans are paid', () => {
        expect(isPaidPlan('starter')).toBe(false);
        expect(isPaidPlan('pro')).toBe(true);
        expect(isPaidPlan('studio')).toBe(true);
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

    it('sells the studio tier with capabilities pro does not have', () => {
        const studio = PLAN_CATALOGUE.studio.features;
        const pro = PLAN_CATALOGUE.pro.features;
        expect(studio.filter((feature) => !pro.includes(feature))).toEqual([
            'priority_queue',
        ]);
    });

    it('does not advertise annual billing', () => {
        for (const id of PLAN_IDS) {
            expect(PLAN_CATALOGUE[id]).not.toHaveProperty('annualPriceCents');
        }
    });
});
