'use client';

import dynamic from 'next/dynamic';
import { Activity, FolderKanban, Users } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProjectRole } from '../../types';
import { AssetsTab } from './assets-tab';

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

function TabSkeleton() {
    return (
        <div className="space-y-3" role="status" aria-label="Loading tab">
            <Skeleton className="h-10 w-64 rounded-lg" />
            <Skeleton className="h-32 w-full rounded-xl" />
        </div>
    );
}

export type WorkspaceTab = 'assets' | 'members' | 'activity';

export const WORKSPACE_TABS: readonly WorkspaceTab[] = ['assets', 'members', 'activity'];

export function isWorkspaceTab(value: string | null): value is WorkspaceTab {
    return value === 'assets' || value === 'members' || value === 'activity';
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
    return (
        <Tabs value={tab} onValueChange={(value) => isWorkspaceTab(value) && onTabChange(value)}>
            <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto bg-transparent p-0">
                <TabsTrigger value="assets" className="h-11 gap-2 px-4">
                    <FolderKanban className="size-4" aria-hidden="true" />
                    Assets
                </TabsTrigger>
                <TabsTrigger value="members" className="h-11 gap-2 px-4">
                    <Users className="size-4" aria-hidden="true" />
                    Members
                </TabsTrigger>
                <TabsTrigger value="activity" className="h-11 gap-2 px-4">
                    <Activity className="size-4" aria-hidden="true" />
                    Activity
                </TabsTrigger>
            </TabsList>

            <TabsContent value="assets" className="mt-6">
                <AssetsTab projectId={projectId} role={role} />
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
