'use client';

import { Activity, FolderKanban, Users } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ProjectRole } from '../../types';
import { AssetsTab } from './assets-tab';
import { MembersTab } from './members-tab';
import { ActivityTab } from './activity-tab';

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
