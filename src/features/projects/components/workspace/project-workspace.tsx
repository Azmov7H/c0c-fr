'use client';

import { useEffect } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { useBreadcrumbStore } from '@/store/breadcrumb-store';
import { ApiError, toApiError } from '@/lib/api-error';
import { joinProjectRoom, leaveProjectRoom } from '@/lib/socket-registry';

import { useProject } from '../../hooks/use-projects';
import { useProjectMembers } from '../../hooks/use-collaboration';
import type { ProjectRole } from '../../types';
import { WorkspaceHeader } from './workspace-header';
import { WorkspaceNotFound } from './workspace-not-found';
import { WorkspaceSkeleton } from './workspace-skeleton';
import { isWorkspaceTab, WorkspaceTabs, type WorkspaceTab } from './workspace-tabs';

const isMissingProject = (error: unknown): boolean =>
    error instanceof ApiError &&
    (error.status === 404 || (error.status === 400 && error.code === 'INVALID_ID'));

export function ProjectWorkspace() {
    const params = useParams<{ id: string }>();
    const projectId = params?.id ?? '';
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const currentUserId = useAuthStore((state) => state.user?.id ?? '');
    const setBreadcrumb = useBreadcrumbStore((state) => state.setProject);
    const clearBreadcrumb = useBreadcrumbStore((state) => state.clearProject);

    const project = useProject(projectId);
    const members = useProjectMembers(projectId);

    const requestedTab = searchParams.get('tab');
    const tab: WorkspaceTab = isWorkspaceTab(requestedTab) ? requestedTab : 'assets';

    useEffect(() => {
        if (project.data) setBreadcrumb(projectId, project.data.title);
        return () => clearBreadcrumb(projectId);
    }, [project.data, projectId, setBreadcrumb, clearBreadcrumb]);

    useEffect(() => {
        if (!projectId) return;
        joinProjectRoom(projectId);
        return () => leaveProjectRoom(projectId);
    }, [projectId]);

    const changeTab = (next: WorkspaceTab) => {
        const query = new URLSearchParams(searchParams.toString());
        if (next === 'assets') query.delete('tab');
        else query.set('tab', next);
        const suffix = query.toString();
        router.replace(suffix ? `${pathname}?${suffix}` : pathname, { scroll: false });
    };

    if (project.isLoading || (project.data && members.isLoading)) {
        return <WorkspaceSkeleton />;
    }

    if (project.isError) {
        if (isMissingProject(project.error)) return <WorkspaceNotFound />;
        return (
            <Alert variant="destructive">
                <AlertTitle>Could not load this project</AlertTitle>
                <AlertDescription className="flex flex-wrap items-center gap-3">
                    {toApiError(project.error, 'Try again in a moment.').message}
                    <Button variant="outline" className="h-11" onClick={() => project.refetch()}>
                        Retry
                    </Button>
                </AlertDescription>
            </Alert>
        );
    }

    if (!project.data) return <WorkspaceNotFound />;

    const data = members.data;
    const role: ProjectRole =
        data?.owner.userId === currentUserId
            ? 'owner'
            : data?.members.find((member) => member.userId === currentUserId)?.role ?? 'viewer';

    return (
        <div className="space-y-6">
            <WorkspaceHeader project={project.data} role={role} />
            <WorkspaceTabs
                projectId={projectId}
                role={role}
                tab={tab}
                onTabChange={changeTab}
            />
        </div>
    );
}
