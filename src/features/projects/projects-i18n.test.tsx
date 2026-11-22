// @vitest-environment jsdom
/**
 * AR-030 — the projects components speak Arabic.
 *
 * The copy test proves the catalogs are complete; this one proves the
 * COMPONENTS read them. The real client components are mounted inside an
 * Arabic provider with the URL locale set to `/ar` (as in production), and the
 * Arabic sentences are asserted — the failure mode a catalog test cannot catch
 * is a component that kept an English literal.
 */
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { renderArabic } from '../../../tests/helpers/projects-intl';
import { ProjectsView } from './components/projects-view';
import { InviteLanding } from './components/invite-landing';
import { NewProjectWizard } from './components/new-project-wizard';
import { StepPlatformTone } from './components/new-project-steps';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { projectFormSchema, type ProjectFormValues } from './lib/project-schemas';

const mocks = vi.hoisted(() => ({
    projects: {
        data: { data: [] as unknown[], meta: { page: 1, total: 0, totalPages: 0 } },
        isLoading: false,
        isError: false,
        error: null as unknown,
        refetch: vi.fn(),
    },
    preview: vi.fn(),
    accept: vi.fn(),
    mutate: vi.fn(),
}));

vi.mock('next/navigation', () => ({
    useSearchParams: () => new URLSearchParams(''),
    usePathname: () => '/ar/projects',
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('./hooks/use-project-view', () => ({
    useProjectView: () => ['grid', vi.fn()] as const,
}));

vi.mock('./hooks/use-projects', () => ({
    useProjects: () => mocks.projects,
    useCreateProject: () => ({ mutate: mocks.mutate, isPending: false }),
}));

vi.mock('@/features/onboarding/hooks/use-onboarding', () => ({
    useOnboardingState: () => ({ data: undefined }),
}));

vi.mock('@/store/auth-store', () => ({
    useAuthStore: (selector: (state: { isAuthenticated: boolean }) => unknown) =>
        selector({ isAuthenticated: true }),
}));

vi.mock('./services/collaboration.service', () => ({
    projectInvitesService: { preview: mocks.preview, accept: mocks.accept },
}));

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('AR-030 the projects surface in Arabic', () => {
    it('the list speaks Arabic in its header, toolbar and empty state', () => {
        renderArabic(<ProjectsView />);

        expect(screen.getByRole('heading', { name: 'المشاريع' })).toBeVisible();
        expect(screen.getByText('مشاريع المحتوى والنصوص وسير العمل الخاصة بك في مكان واحد.')).toBeVisible();
        expect(screen.getByPlaceholderText('ابحث في المشاريع...')).toBeVisible();
        expect(screen.getByText('لا توجد مشاريع بعد')).toBeVisible();
        expect(screen.getByRole('link', { name: 'مشروع جديد' })).toBeVisible();
    });

    it('the invite landing speaks Arabic and keeps the URL locale out of the copy', async () => {
        mocks.preview.mockRejectedValueOnce({ status: 404 });
        const client = new QueryClient({
            defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
        });
        renderArabic(
            <QueryClientProvider client={client}>
                <InviteLanding token="tok_test" />
            </QueryClientProvider>
        );

        expect(await screen.findByText('الدعوة غير متاحة')).toBeVisible();
        expect(
            screen.getByText('رابط الدعوة هذا غير صالح. ربما انتهت صلاحيته أو أُلغي أو استُخدم بالفعل.')
        ).toBeVisible();
        expect(screen.getByRole('link', { name: 'تسجيل الدخول' })).toBeVisible();
    });

    it('the wizard speaks Arabic in its title, steps and navigation', () => {
        renderArabic(<NewProjectWizard />);

        expect(screen.getByRole('heading', { name: 'إنشاء مشروع' })).toBeVisible();
        expect(screen.getByText('عرّف الفكرة. ستكون بذرة نصوصك.')).toBeVisible();
        expect(screen.getByRole('button', { name: 'متابعة' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'المشاريع' })).toBeVisible();
    });

    it('the platform cards translate the summary and the effects copy', () => {
        function Harness() {
            const form = useForm<ProjectFormValues>({
                resolver: zodResolver(projectFormSchema()),
                defaultValues: {
                    title: 'T',
                    description: '',
                    idea: 'I',
                    platform: 'youtube',
                    tone: 'educational',
                    contentFormat: 'short',
                },
            });
            return (
                <Form {...form}>
                    <StepPlatformTone form={form as UseFormReturn<ProjectFormValues>} />
                </Form>
            );
        }
        renderArabic(<Harness />);

        expect(screen.getByText('فيديوهات طويلة وShorts')).toBeVisible();
        expect(
            screen.getByText('صور مصغرة 16:9، نصوص من 8 إلى 12 دقيقة، من 3 إلى 5 وسوم عامة.')
        ).toBeVisible();
        expect(screen.getByText('تعليمي')).toBeVisible();
    });
});
