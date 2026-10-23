import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import {
    FEATURE_LABELS,
    PLAN_CATALOGUE,
    PLAN_COMPARISON,
    PLAN_IDS,
    formatMonthlyPrice,
    planHighlights,
} from './plans';

const ROOT = path.resolve(__dirname, '../../../..');

describe('plan catalogue', () => {
    it('defines the monthly list prices once', () => {
        expect(PLAN_CATALOGUE.starter.monthlyPriceCents).toBe(0);
        expect(PLAN_CATALOGUE.pro.monthlyPriceCents).toBe(4900);
        expect(PLAN_CATALOGUE.studio.monthlyPriceCents).toBe(19900);
        expect(formatMonthlyPrice(PLAN_CATALOGUE.starter)).toBe('Free');
        expect(formatMonthlyPrice(PLAN_CATALOGUE.pro)).toBe('$49/month');
        expect(formatMonthlyPrice(PLAN_CATALOGUE.studio)).toBe('$199/month');
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

    it('lists every enforced backend capability in the comparison table', () => {
        const labels = PLAN_COMPARISON.map((row) => row.label);
        for (const label of Object.values(FEATURE_LABELS)) {
            expect(labels).toContain(label);
        }
        expect(labels).toContain('Storage');
        expect(labels).toContain('Concurrent generations');
    });

    it('sells the studio tier with capabilities pro does not have', () => {
        const studio = PLAN_CATALOGUE.studio.features;
        const pro = PLAN_CATALOGUE.pro.features;
        expect(studio.filter((feature) => !pro.includes(feature))).toEqual([
            'priority_queue',
        ]);
        expect(planHighlights(PLAN_CATALOGUE.studio)).toContain(
            'Priority generation queue'
        );
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
            const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
            expect(source, `${file} hardcodes a dollar price`).not.toMatch(/\$\d{2,}/);
        }
    });
});
