// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import enAdmin from '../../../../messages/en/admin.json';

import { ReasonField } from './reason-field';

const renderWithProvider = (node: React.ReactNode) =>
    render(
        <NextIntlClientProvider locale="en" messages={{ admin: enAdmin }}>
            {node}
        </NextIntlClientProvider>,
    );

describe('ReasonField (spec §7.2 + spec §3.3 step 3)', () => {
    it('shows the length counter against the 500-char cap', () => {
        const onChange = vi.fn();
        renderWithProvider(<ReasonField value="hello" onChange={onChange} />);
        expect(screen.getByText('5/500')).toBeTruthy();
    });

    it('calls onChange with the typed text and enforces the max length', () => {
        const onChange = vi.fn();
        renderWithProvider(<ReasonField value="" onChange={onChange} />);
        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: 'x'.repeat(600) } });
        expect(onChange).toHaveBeenCalledWith('x'.repeat(500));
    });
});
