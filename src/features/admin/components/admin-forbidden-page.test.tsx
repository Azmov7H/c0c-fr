// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import enAdmin from '../../../../messages/en/admin.json';

import { AdminForbiddenPage } from './admin-forbidden-page';

describe('AdminForbiddenPage (spec §5.2, spec §2.4)', () => {
    it('renders the neutral 403 page with the link back to /dashboard', () => {
        render(
            <NextIntlClientProvider locale="en" messages={{ admin: enAdmin }}>
                <AdminForbiddenPage />
            </NextIntlClientProvider>,
        );
        expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
        const link = screen.getByRole('link', { name: 'Back to your dashboard' });
        expect(link.getAttribute('href')).toBe('/dashboard');
    });
});
