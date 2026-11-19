// @vitest-environment jsdom
/**
 * AR-028 — the settings and billing screens speak Arabic.
 *
 * The copy test proves the catalogs are complete; this one proves the
 * COMPONENTS read them. The real client components are mounted inside an
 * Arabic provider (with the URL locale set to `/ar`, as in production) and the
 * Arabic sentences are asserted — the failure mode a catalog test cannot catch
 * is a component that kept an English literal.
 */
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import type { BillingSummary } from '@/features/billing/types';
import arSettings from '../../../messages/ar/settings.json';
import arBilling from '../../../messages/ar/billing.json';
import arDataState from '../../../messages/ar/dataState.json';
import arAuth from '../../../messages/ar/auth.json';
import arPricing from '../../../messages/ar/pricing.json';
import { SettingsDashboard } from './components/settings-dashboard';
import { BillingSettings } from './components/billing-settings';

const mocks = vi.hoisted(() => ({
    profile: { firstName: 'أحمد', lastName: 'العلي', email: 'a@x.y' },
    summary: null as BillingSummary | null,
    checkoutReturn: { phase: 'idle', target: null as 'pro' | 'studio' | null },
}));

vi.mock('./hooks/use-settings', () => ({
    useProfile: () => ({ data: mocks.profile, isLoading: false, error: null }),
    useUpdateProfile: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/features/auth/hooks/use-auth', () => ({
    useLogout: () => ({ mutate: vi.fn() }),
    useLogoutAll: () => ({ mutate: vi.fn(), isPending: false }),
    useChangePassword: () => ({ mutate: vi.fn(), isPending: false, error: null }),
}));

vi.mock('@/features/billing/hooks/use-billing', () => ({
    useBillingSummary: () => ({
        data: mocks.summary,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
    }),
    useCredits: () => ({
        data: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
    }),
    useCheckout: () => ({ mutate: vi.fn(), isPending: false }),
    usePortal: () => ({ mutate: vi.fn(), isPending: false }),
    useCheckoutReturn: () => mocks.checkoutReturn,
    useCreditHistory: () => ({
        data: null,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
    }),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn() }),
    usePathname: () => '/ar/settings',
}));

const AR_MESSAGES = {
    settings: arSettings,
    billing: arBilling,
    dataState: arDataState,
    auth: arAuth,
    pricing: arPricing,
};

function renderArabic(ui: ReactElement) {
    return render(
        <NextIntlClientProvider locale="ar" messages={AR_MESSAGES}>
            {ui}
        </NextIntlClientProvider>
    );
}

const summary = (overrides: Partial<BillingSummary> = {}): BillingSummary => ({
    plan: 'pro',
    features: [
        'ai.generation',
        'teams.create',
        'teams.invite',
        'media.publish',
        'project.members',
        'analytics.advanced',
        'export.csv',
    ],
    quota: {
        'ai.generation': 500,
        'teams.create': 10,
        'project.members': 10,
        storageGB: 50,
    },
    concurrentGenerations: 3,
    usage: [
        {
            feature: 'ai.generation',
            month: '2026-10',
            used: 12,
            limit: 500,
            remaining: 488,
            resetAt: '2026-11-05T12:00:00.000Z',
        },
    ],
    renewalDate: '2026-11-05T12:00:00.000Z',
    cancelAtPeriodEnd: false,
    status: 'active',
    managedByStripe: true,
    ...overrides,
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('settings + billing speak Arabic (AR-028)', () => {
    it('renders the settings screen from the Arabic catalog', () => {
        renderArabic(<SettingsDashboard defaultTab="profile" />);

        expect(screen.getByRole('heading', { name: 'إعدادات النظام' })).toBeVisible();
        expect(screen.getByText('المعلومات الشخصية')).toBeVisible();
        expect(screen.getByLabelText('الاسم الأول')).toBeTruthy();
        expect(screen.getByLabelText('البريد الإلكتروني')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'حفظ التغييرات' })).toBeTruthy();
        expect(screen.getByRole('tab', { name: /ملفي الشخصي/ })).toBeTruthy();
        expect(screen.getByRole('tab', { name: /الأمان/ })).toBeTruthy();
    });

    it('shows the unknown-tab notice in Arabic', () => {
        renderArabic(<SettingsDashboard defaultTab="api" />);

        expect(screen.getByText('التبويب غير موجود')).toBeVisible();
        expect(screen.getByText(/تمت إزالة إعدادات API/)).toBeVisible();
    });

    it('renders the billing screen (status, plan, usage, checkout) in Arabic', () => {
        mocks.summary = summary();
        mocks.checkoutReturn.phase = 'processing';
        mocks.checkoutReturn.target = 'pro';
        renderArabic(<BillingSettings />);

        expect(screen.getByText('الخطة الحالية')).toBeVisible();
        expect(screen.getByText('فعّالة')).toBeTruthy();
        expect(screen.getByText(/الاستخدام هذه الفترة/)).toBeTruthy();
        expect(screen.getByText('دفعتك قيد المعالجة')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'تحديث الحالة' })).toBeTruthy();
    });
});
