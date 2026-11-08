// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

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

describe('SettingsDashboard (M2-T27)', () => {
    it('has no api tab in the DOM', () => {
        render(<SettingsDashboard defaultTab="profile" />);
        expect(screen.queryByText('AI API Keys')).toBeNull();
        expect(screen.queryByText('AI Provider Tokens')).toBeNull();
    });

    it('unknown ?tab=api falls back to profile with a notice', () => {
        render(<SettingsDashboard defaultTab="api" />);
        expect(screen.getByText(/API settings were removed/)).toBeVisible();
    });
});
