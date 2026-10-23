// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';

import { PlanComparisonTable, PricingCards, PricingFaq } from './pricing';

afterEach(cleanup);

describe('pricing surface', () => {
    it('renders all three tiers with the single-source prices and quotas', () => {
        render(<PricingCards />);

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

    it('routes paid CTAs to billing and free CTAs to signup', () => {
        render(<PricingCards />);

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

    it('renders every enforced capability in a semantically labelled table', () => {
        render(<PlanComparisonTable />);

        const table = screen.getByRole('table', {
            name: /Feature and quota comparison/i,
        });
        const rows = within(table).getAllByRole('row');
        expect(rows.length).toBeGreaterThan(9);
        expect(within(table).getByRole('rowheader', { name: 'API access' })).toBeTruthy();
        expect(
            within(table).getByRole('rowheader', { name: 'Priority generation queue' })
        ).toBeTruthy();
        expect(within(table).getByRole('columnheader', { name: 'Studio' })).toBeTruthy();
    });

    it('answers only billing questions the product can honour', () => {
        render(<PricingFaq />);

        expect(screen.getByText('Do you offer annual billing?')).toBeTruthy();
        expect(screen.getByText(/Every paid plan is billed monthly/i)).toBeTruthy();
        expect(screen.queryByRole('button', { name: /annual/i })).toBeNull();
    });
});
