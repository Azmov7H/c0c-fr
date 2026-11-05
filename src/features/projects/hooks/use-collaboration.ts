import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';

import { toApiError } from '@/lib/api-error';
import { projectKeys } from '../lib/query-keys';
import {
    projectActivityService,
    projectInvitesService,
    projectMembersService,
} from '../services/collaboration.service';
import type {
    ProjectMembersResponse,
    ProjectMemberRole,
    ProjectActivityType,
} from '../types';

const invalidateCollaboration = (
    queryClient: ReturnType<typeof useQueryClient>,
    projectId: string
) => {
    void queryClient.invalidateQueries({ queryKey: projectKeys.members(projectId) });
    void queryClient.invalidateQueries({ queryKey: projectKeys.invites(projectId) });
    queryClient.invalidateQueries({ queryKey: projectKeys.activity(projectId) }).catch(() => {});
};

export function useProjectMembers(projectId: string) {
    return useQuery({
        queryKey: projectKeys.members(projectId),
        queryFn: () => projectMembersService.list(projectId),
        enabled: !!projectId,
    });
}

export function useUpdateMemberRole(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, role }: { userId: string; role: ProjectMemberRole }) =>
            projectMembersService.updateRole(projectId, userId, role),
        onMutate: async ({ userId, role }) => {
            await queryClient.cancelQueries({ queryKey: projectKeys.members(projectId) });
            const previous = queryClient.getQueryData<ProjectMembersResponse>(
                projectKeys.members(projectId)
            );
            queryClient.setQueryData<ProjectMembersResponse>(
                projectKeys.members(projectId),
                (current) =>
                    current
                        ? {
                              ...current,
                              members: current.members.map((member) =>
                                  member.userId === userId ? { ...member, role } : member
                              ),
                          }
                        : current
            );
            return { previous };
        },
        onSuccess: (_data, variables) => {
            toast.success(`Role changed to ${variables.role}.`);
        },
        onError: (error, _variables, context) => {
            if (context?.previous) {
                queryClient.setQueryData(projectKeys.members(projectId), context.previous);
            }
            toast.error(toApiError(error, 'Failed to change role.').message);
        },
        onSettled: () => invalidateCollaboration(queryClient, projectId),
    });
}

export function useRemoveMember(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId: string) => projectMembersService.remove(projectId, userId),
        onSuccess: () => {
            toast.success('Member removed from the project.');
        },
        onError: (error) => {
            toast.error(toApiError(error, 'Failed to remove member.').message);
        },
        onSettled: () => invalidateCollaboration(queryClient, projectId),
    });
}

export function useProjectInvites(projectId: string) {
    return useQuery({
        queryKey: projectKeys.invites(projectId),
        queryFn: () => projectInvitesService.list(projectId),
        enabled: !!projectId,
        // Pending invites expire without any server event; refresh so a stale row
        // cannot sit there claiming to be live.
        refetchInterval: 60_000,
    });
}

export function useCreateInvite(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { email: string; role: ProjectMemberRole }) =>
            projectInvitesService.create(projectId, data),
        onSuccess: () => {
            toast.success('Invite created. Share the link below.');
        },
        onError: (error) => {
            toast.error(toApiError(error, 'Failed to create invite.').message);
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: projectKeys.invites(projectId) });
            void queryClient.invalidateQueries({ queryKey: projectKeys.activity(projectId) });
        },
    });
}

export function useRevokeInvite(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (inviteId: string) => projectInvitesService.revoke(projectId, inviteId),
        onSuccess: () => {
            toast.success('Invite revoked.');
        },
        onError: (error) => {
            toast.error(toApiError(error, 'Failed to revoke invite.').message);
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: projectKeys.invites(projectId) });
            void queryClient.invalidateQueries({ queryKey: projectKeys.activity(projectId) });
        },
    });
}

export function useProjectActivity(
    projectId: string,
    filters: { type?: ProjectActivityType; page: number }
) {
    return useQuery({
        queryKey: projectKeys.activity(projectId, filters),
        queryFn: () =>
            projectActivityService.list(projectId, {
                type: filters.type,
                page: filters.page,
                limit: 20,
            }),
        enabled: !!projectId,
        placeholderData: (previous) => previous,
    });
}
