// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import enAdmin from '../../../../messages/en/admin.json';

import { formatCredits } from '@/lib/format';

import { CreditAmount } from './money';

const renderWithProvider = (node: React.ReactNode) =>
    render(
        <NextIntlClientProvider locale="en" messages={{ admin: enAdmin }}>
            {node}
        </NextIntlClientProvider>,
    );

describe('formatCredits (spec §7.2, `Money`)', () => {
    it('formats zero and positive integers with tabular numerals and grouping', () => {
        expect(formatCredits(0, 'en')).toBe('0');
        expect(formatCredits(5, 'en')).toBe('5');
        expect(formatCredits(1234, 'en')).toBe('1,234');
        expect(formatCredits(1_000_000, 'en')).toBe('1,000,000');
    });

    it('formats negative values with the minus sign', () => {
        expect(formatCredits(-10, 'en')).toBe('-10');
    });
});

describe('CreditAmount (spec §7.2, `CreditAmount`)', () => {
    it('renders positive grants with an explicit + sign', () => {
        renderWithProvider(<CreditAmount value={500} kind="grant" />);
        expect(screen.getByText('+500')).toBeTruthy();
    });

    it('renders negative amounts with a - sign (destructive)', () => {
        renderWithProvider(<CreditAmount value={-10} />);
        expect(screen.getByText('-10')).toBeTruthy();
    });

    it('renders a zero amount without a sign', () => {
        renderWithProvider(<CreditAmount value={0} />);
        expect(screen.getByText('0')).toBeTruthy();
    });
});
