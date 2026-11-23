// @vitest-environment jsdom
/**
 * AR-031 — the workspace surface speaks Arabic.
 *
 * The copy test proves the catalogs are complete; this one proves the
 * COMPONENTS read them. The real client components are mounted inside the
 * Arabic provider with the URL locale set to `/ar` (as in production), and the
 * Arabic sentences are asserted — the failure mode a catalog test cannot catch
 * is a component that kept an English literal.
 */
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen } from '@testing-library/react';

import { renderArabic } from '../../../tests/helpers/workspace-intl';

const mocks = vi.hoisted(() => ({
    project: { data: { _id: 'p1', title: 'A project' }, isLoading: false },
    scripts: { data: [] as unknown[], isLoading: false },
    thumbnails: { data: [] as unknown[], isLoading: false },
    media: { data: { data: [] as unknown[] }, isLoading: false },
    audio: { data: [] as unknown[], isLoading: false },
    stages: [] as unknown[],
}));

vi.mock('next/navigation', () => ({
    usePathname: () => '/ar/projects/p1',
    useSearchParams: () => new URLSearchParams(''),
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
    useParams: () => ({ id: 'p1' }),
}));

vi.mock('./hooks/use-projects', () => ({
    useProject: () => mocks.project,
    useCreateProject: () => ({ mutate: vi.fn(), isPending: false }),
    useDeleteProject: () => ({ mutate: vi.fn(), isPending: false }),
    useUpdateProject: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('@/features/scripts/hooks/use-scripts', () => ({
    useProjectScripts: () => mocks.scripts,
    useGenerateScript: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('@/features/thumbnails/hooks/use-thumbnails', () => ({
    useProjectThumbnails: () => mocks.thumbnails,
}));
vi.mock('@/features/media/hooks/use-media', () => ({
    useProjectMedia: () => mocks.media,
}));
vi.mock('@/features/audio/hooks/use-audio', () => ({
    useProjectAudio: () => mocks.audio,
    useGenerateAudio: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('@/features/seo/hooks/use-seo', () => ({
    useProjectSEO: () => ({ data: null, isLoading: false }),
    useGenerateSEO: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('./hooks/use-workflow-stages', () => ({
    useWorkflowStages: () => ({ stages: mocks.stages, currentStageId: 'script', isLoading: false }),
}));
vi.mock('@/features/billing/hooks/use-billing', () => ({
    useBillingSummary: () => ({ data: { usage: [], quota: {} } }),
    useCredits: () => ({ data: { balance: 0, held: 0, period: '2026-11', resetAt: null, plan: 'starter' } }),
}));
vi.mock('./hooks/use-collaboration', () => {
    const mutation = () => ({ mutate: vi.fn(), isPending: false });
    const meta = { page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false };
    return {
        useProjectActivity: () => ({
            data: { items: [], meta },
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
        }),
        useProjectMembers: () => ({
            data: {
                projectId: 'p1',
                owner: { userId: 'u1', role: 'owner', user: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', avatar: null } },
                members: [],
                memberLimit: 5,
                usedSlots: 0,
            },
            isLoading: false,
            error: null,
            refetch: vi.fn(),
        }),
        useProjectInvites: () => ({ data: [], isLoading: false, refetch: vi.fn() }),
        useUpdateMemberRole: mutation,
        useRemoveMember: mutation,
        useCreateInvite: mutation,
        useRevokeInvite: mutation,
    };
});
vi.mock('./components/workspace/project-export', () => ({
    ProjectExport: () => <div>project export</div>,
}));
vi.mock('@/features/thumbnails/components/thumbnail-generator', () => ({
    ThumbnailGenerator: () => <div>thumbnail generator</div>,
}));

import { WorkspaceTabs } from './components/workspace/workspace-tabs';
import { WorkspaceNotFound } from './components/workspace/workspace-not-found';
import { PreviewPanel } from './components/workspace/preview-panel';
import { ActivityTab } from './components/workspace/activity-tab';
import { WorkflowStepper } from './components/workspace/workflow-stepper';
import { AssetsTab } from './components/workspace/assets-tab';
import { MembersTab } from './components/workspace/members-tab';
import { GenerationIndicator } from '@/features/billing/components/generation-indicator';

beforeEach(() => {
    mocks.project = { data: { _id: 'p1', title: 'A project' }, isLoading: false };
    mocks.scripts = { data: [], isLoading: false };
    mocks.thumbnails = { data: [], isLoading: false };
    mocks.media = { data: { data: [] }, isLoading: false };
    mocks.audio = { data: [], isLoading: false };
    mocks.stages = [];
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('AR-031 the workspace surface in Arabic', () => {
    it('the tabs and the not-found state speak Arabic', () => {
        renderArabic(<WorkspaceTabs projectId="p1" role="owner" tab="assets" onTabChange={vi.fn()} />);
        expect(screen.getByRole('tab', { name: 'الأصول' })).toBeVisible();
        expect(screen.getByRole('tab', { name: 'الوسائط' })).toBeVisible();
        expect(screen.getByRole('tab', { name: 'النشاط' })).toBeVisible();
        cleanup();

        renderArabic(<WorkspaceNotFound />);
        expect(screen.getByRole('heading', { name: 'المشروع غير موجود' })).toBeVisible();
        expect(screen.getByText('هذا المشروع غير متاح، أو أن الرابط غير صحيح.')).toBeVisible();
        expect(screen.getByRole('link', { name: 'العودة إلى المشاريع' })).toBeVisible();
    });

    it('the preview panel speaks Arabic in its empty state and missing list', () => {
        renderArabic(<PreviewPanel projectId="p1" />);
        expect(screen.getByText('لا شيء للمعاينة بعد')).toBeVisible();
        cleanup();

        mocks.scripts = {
            data: [
                {
                    id: 's1',
                    version: 2,
                    wordCount: 42,
                    sections: [{ order: 0, label: 'Hook', content: 'Hello there' }],
                    isDeleted: false,
                    createdAt: '2026-11-01T00:00:00.000Z',
                },
            ],
            isLoading: false,
        };
        renderArabic(<PreviewPanel projectId="p1" />);
        expect(
            screen.getByText(/ما زال ينقص: الصورة المصغّرة, صور المشاهد, التعليق الصوتي/)
        ).toBeVisible();
    });

    it('the activity and workflow panels speak Arabic', () => {
        renderArabic(<ActivityTab projectId="p1" />);
        expect(screen.getByText('لا يوجد نشاط بعد')).toBeVisible();
        expect(
            screen.getByText(/ستظهر الدعوات وتغييرات الأعضاء وعمليات الإنشاء هنا/)
        ).toBeVisible();
        cleanup();

        mocks.stages = [
            { id: 'creation', label: 'المشروع', tab: 'assets', ready: true, complete: true, blockedReason: null, detail: 'A project' },
            { id: 'script', label: 'النص', tab: 'assets', ready: true, complete: false, blockedReason: null, detail: 'لا يوجد نص بعد' },
        ];
        renderArabic(<WorkflowStepper projectId="p1" />);
        expect(screen.getByRole('navigation', { name: 'سير عمل الإنتاج' })).toBeVisible();
        expect(screen.getByRole('link', { name: 'النص — المرحلة الحالية' })).toBeVisible();
        expect(screen.getByRole('link', { name: 'المشروع — مكتملة' })).toBeVisible();
    });

    it('user names, emails and invite URLs are bidi-isolated', () => {
        const { container } = renderArabic(<MembersTab projectId="p1" role="owner" />);
        // Ada Lovelace is the owner and ada@example.com their email — both
        // user data must sit in a <bdi> so an English name next to Arabic verbs
        // cannot flip the sentence direction.
        const isolates = [...container.querySelectorAll('bdi')].map((node) => node.textContent);
        expect(isolates).toContain('Ada Lovelace');
        expect(isolates.some((value) => value?.includes('ada@example.com'))).toBe(true);
    });

    it('the assets tab and generation indicator speak Arabic', () => {
        renderArabic(<AssetsTab projectId="p1" role="viewer" />);
        expect(
            screen.getByText('دورك يتيح لك عرض الأصول فقط، دون إنشاءها أو تعديلها.')
        ).toBeVisible();
        expect(screen.getByText(/يمكن للمحرر إنشاء نص/)).toBeVisible();
        cleanup();

        renderArabic(<AssetsTab projectId="p1" role="editor" />);
        expect(screen.getAllByRole('button', { name: 'إنشاء' }).length).toBeGreaterThan(0);
        expect(screen.getByText(/أنشئ النص الأول/)).toBeVisible();
        cleanup();

        mocks.scripts = { data: [], isLoading: false };
        renderArabic(<GenerationIndicator />);
        expect(screen.getByText('ai.generation غير محدود')).toBeVisible();
    });
});
