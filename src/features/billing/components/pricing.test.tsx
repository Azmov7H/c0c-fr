// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';

import { PlanComparisonTable, PricingCards, PricingFaq } from './pricing';

// AR-014: the pricing surface is a SERVER component (the marketing pages
// have no client runtime), so the server reads the locale and hands it down.
// The English locale is the baseline the assertions below expect.
const LOCALE = 'en' as const;

/**
 * AR-023: the components are async server components now — they read the
 * catalog through `getTranslations`, exactly like the marketing page does.
 * A client test has no request, so the server seam is mocked with a real
 * translator over the real English catalog: the assertions below are about
 * the RENDERED surface, not about how the messages arrive.
 */
vi.mock('@/i18n/server', async () => {
    const { createTranslator } = await import('next-intl');
    const catalog = (await import('../../../../messages/en/pricing.json')).default;
    const translator = createTranslator({
        locale: 'en',
        messages: { pricing: catalog },
        namespace: 'pricing',
    });
    return {
        getTranslations: async (namespace: string) => {
            if (namespace !== 'pricing') {
                throw new Error(`unexpected namespace: ${namespace}`);
            }
            return translator;
        },
    };
});

afterEach(cleanup);

describe('pricing surface', () => {
    it('renders all three tiers with the single-source prices and quotas', async () => {
        render(await PricingCards({ locale: LOCALE }));

        expect(screen.getByRole('heading', { name: 'Starter' })).toBeTruthy();
        expect(screen.getByRole('heading', { name: 'Pro' })).toBeTruthy();
        expect(screen.getByRole('heading', { name: 'Studio' })).toBeTruthy();
        expect(screen.getByText('Free')).toBeTruthy();
        expect(screen.getByText('$49/month')).toBeTruthy();
        expect(screen.getByText('$199/month')).toBeTruthy();
        expect(screen.getByText('500 AI generations per month')).toBeTruthy();
        expect(screen.getByText('2,000 AI generations per month')).toBeTruthy();
        expect(screen.getByText('Recommended for weekly publishing')).toBeTruthy();
    });

    it('routes paid CTAs to billing and free CTAs to signup', async () => {
        render(await PricingCards({ locale: LOCALE }));

        expect(screen.getByRole('link', { name: /start free/i }).getAttribute('href')).toBe(
            '/signup'
        );
        expect(screen.getByRole('link', { name: /choose pro/i }).getAttribute('href')).toBe(
            '/settings/billing?plan=pro'
        );
        expect(screen.getByRole('link', { name: /choose studio/i }).getAttribute('href')).toBe(
            '/settings/billing?plan=studio'
        );
    });

    it('renders every enforced capability in a semantically labelled table', async () => {
        render(await PlanComparisonTable({ locale: LOCALE }));

        const table = screen.getByRole('table', {
            name: /Feature and quota comparison/i,
        });
        const rows = within(table).getAllByRole('row');
        expect(rows.length).toBeGreaterThan(9);
        // M2-T27 Q5: the deleted `API access` copy must NOT come back — the
        // export row is the capability that replaced it (P09.2: on every
        // plan, with the Free tier bounded by its allowance).
        expect(within(table).queryByRole('rowheader', { name: 'API access' })).toBeNull();
        expect(within(table).getByRole('rowheader', { name: 'CSV export' })).toBeTruthy();
        expect(
            within(table).getByRole('rowheader', { name: 'Priority generation queue' })
        ).toBeTruthy();
        expect(within(table).getByRole('columnheader', { name: 'Studio' })).toBeTruthy();
    });

    it('answers only billing questions the product can honour', async () => {
        render(await PricingFaq({ locale: LOCALE }));

        expect(screen.getByText('Do you offer annual billing?')).toBeTruthy();
        expect(screen.getByText(/Every paid plan is billed monthly/i)).toBeTruthy();
        expect(screen.queryByRole('button', { name: /annual/i })).toBeNull();
    });
});
