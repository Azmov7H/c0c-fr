'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Activity, Clapperboard, Eye, FileImage as ImageIcon, FolderKanban, Users } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProjectRole } from '../../types';
import { workspaceTabLabel } from '../../lib/workspace-labels';
import { AssetsTab } from './assets-tab';
import { PreviewPanel } from './preview-panel';

/**
 * T20: only the selected tab renders (Radix unmounts the rest), so the other
 * two tabs' modules — the invite form's zod schema and the activity feed's
 * renderers — used to sit in the workspace's first load for code that a visitor
 * behind the default Assets tab never ran. They are split now and fetched on
 * the first click.
 */
const MembersTab = dynamic(() => import('./members-tab').then((mod) => mod.MembersTab), {
    ssr: false,
    loading: () => <TabSkeleton />,
});

const ActivityTab = dynamic(() => import('./activity-tab').then((mod) => mod.ActivityTab), {
    ssr: false,
    loading: () => <TabSkeleton />,
});

// M2-T23: media workspace (lazy — large per-slot components and <audio>).
const MediaTab = dynamic(
    () => import('./media-tab').then((mod) => mod.MediaTab),
    { ssr: false, loading: () => <TabSkeleton /> },
);

// Advertisements: the project-first Generate Video surface stays out of the
// workspace's initial bundle until the tab is opened.
const VideoTab = dynamic(
    () => import('@/features/advertisements/components/video-tab').then((mod) => mod.VideoTab),
    { ssr: false, loading: () => <TabSkeleton /> },
);

function TabSkeleton() {
    const t = useTranslations('workspace');
    return (
        <div className="space-y-3" role="status" aria-label={t('tabs.loading')}>
            <Skeleton className="h-10 w-64 rounded-lg" />
            <Skeleton className="h-32 w-full rounded-xl" />
        </div>
    );
}

export type WorkspaceTab = 'assets' | 'video' | 'media' | 'preview' | 'members' | 'activity';

export const WORKSPACE_TABS: readonly WorkspaceTab[] = [
    'assets',
    'video',
    'media',
    'preview',
    'members',
    'activity',
];

export function isWorkspaceTab(value: string | null): value is WorkspaceTab {
    return (
        value === 'assets' ||
        value === 'video' ||
        value === 'media' ||
        value === 'preview' ||
        value === 'members' ||
        value === 'activity'
    );
}

export function WorkspaceTabs({
    projectId,
    role,
    tab,
    onTabChange,
}: {
    projectId: string;
    role: ProjectRole;
    tab: WorkspaceTab;
    onTabChange: (tab: WorkspaceTab) => void;
}) {
    const t = useTranslations('workspace');
    return (
        <Tabs value={tab} onValueChange={(value) => isWorkspaceTab(value) && onTabChange(value)}>
            <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto bg-transparent p-0">
                <TabsTrigger value="assets" className="h-11 gap-2 px-4">
                    <FolderKanban className="size-4" aria-hidden="true" />
                    {workspaceTabLabel(t, 'assets')}
                </TabsTrigger>
                <TabsTrigger value="video" className="h-11 gap-2 px-4">
                    <Clapperboard className="size-4" aria-hidden="true" />
                    {workspaceTabLabel(t, 'video')}
                </TabsTrigger>
                <TabsTrigger value="media" className="h-11 gap-2 px-4">
                    <ImageIcon className="size-4" aria-hidden="true" />
                    {workspaceTabLabel(t, 'media')}
                </TabsTrigger>
                {/* P11.3: the Preview stage — a read-only assembly of what the
                    project has. The other tabs stay exactly as they were. */}
                <TabsTrigger value="preview" className="h-11 gap-2 px-4">
                    <Eye className="size-4" aria-hidden="true" />
                    {workspaceTabLabel(t, 'preview')}
                </TabsTrigger>
                <TabsTrigger value="members" className="h-11 gap-2 px-4">
                    <Users className="size-4" aria-hidden="true" />
                    {workspaceTabLabel(t, 'members')}
                </TabsTrigger>
                <TabsTrigger value="activity" className="h-11 gap-2 px-4">
                    <Activity className="size-4" aria-hidden="true" />
                    {workspaceTabLabel(t, 'activity')}
                </TabsTrigger>
            </TabsList>

            <TabsContent value="assets" className="mt-6">
                <AssetsTab projectId={projectId} role={role} />
            </TabsContent>
            <TabsContent value="video" className="mt-6">
                <VideoTab projectId={projectId} role={role} />
            </TabsContent>
            <TabsContent value="media" className="mt-6">
                <MediaTab projectId={projectId} role={role} />
            </TabsContent>
            <TabsContent value="preview" className="mt-6">
                <PreviewPanel projectId={projectId} />
            </TabsContent>
            <TabsContent value="members" className="mt-6">
                <MembersTab projectId={projectId} role={role} />
            </TabsContent>
            <TabsContent value="activity" className="mt-6">
                <ActivityTab projectId={projectId} />
            </TabsContent>
        </Tabs>
    );
}
