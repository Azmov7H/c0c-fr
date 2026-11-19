// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import enSettings from '../../../../messages/en/settings.json';
import enDataState from '../../../../messages/en/dataState.json';
import { SettingsDashboard } from './settings-dashboard';

const mocks = vi.hoisted(() => ({
    profile: { firstName: 'Avery', lastName: 'One', email: 'a@x.y' },
}));

vi.mock('../hooks/use-settings', () => ({
    useProfile: () => ({ data: mocks.profile, isLoading: false, error: null }),
    useUpdateProfile: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/features/auth/hooks/use-auth', () => ({
    useLogout: () => ({ mutate: vi.fn() }),
    useLogoutAll: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

/**
 * AR-028: the screen reads the catalog through the client provider, exactly
 * as the (dashboard) layout hands it over in production. The English catalog
 * is the regression floor for every assertion below.
 */
function renderSettings(defaultTab: string) {
    return render(
        <NextIntlClientProvider
            locale="en"
            messages={{ settings: enSettings, dataState: enDataState }}
        >
            <SettingsDashboard defaultTab={defaultTab} />
        </NextIntlClientProvider>
    );
}

describe('SettingsDashboard (M2-T27)', () => {
    it('has no api tab in the DOM', () => {
        renderSettings('profile');
        expect(screen.queryByText('AI API Keys')).toBeNull();
        expect(screen.queryByText('AI Provider Tokens')).toBeNull();
    });

    it('unknown ?tab=api falls back to profile with a notice', () => {
        renderSettings('api');
        expect(screen.getByText(/API settings were removed/)).toBeVisible();
    });

    it('renders the profile panel with the English catalog', () => {
        renderSettings('profile');
        expect(screen.getByRole('heading', { name: 'System Settings' })).toBeVisible();
        expect(screen.getByText('Personal Information')).toBeVisible();
        expect(screen.getByLabelText('First Name')).toBeTruthy();
        expect(screen.getByLabelText('Email Address')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Save Changes' })).toBeTruthy();
        expect(screen.getByRole('tab', { name: /My Profile/ })).toBeTruthy();
        expect(screen.getByRole('tab', { name: /Security/ })).toBeTruthy();
    });
});
