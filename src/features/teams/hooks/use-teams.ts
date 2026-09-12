import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsService } from '../services/teams.service';
import { CreateTeamDTO, InviteMemberDTO } from '../types';
import { toast } from 'sonner';

interface RequestErrorShape {
    message?: string;
    response?: { data?: { error?: { message?: string } } };
}

function getErrorMessage(error: RequestErrorShape, fallback: string): string {
    return error?.message || error?.response?.data?.error?.message || fallback;
}

export const teamKeys = {
    all: ['teams'] as const,
    lists: () => [...teamKeys.all, 'list'] as const,
    details: () => [...teamKeys.all, 'detail'] as const,
    detail: (id: string) => [...teamKeys.details(), id] as const,
};

export const useTeams = () => {
    return useQuery({
        queryKey: teamKeys.lists(),
        queryFn: () => teamsService.listTeams(),
    });
};

export const useTeam = (id: string) => {
    return useQuery({
        queryKey: ['teams', 'detail', id],
        queryFn: () => teamsService.getTeam(id),
        enabled: !!id,
    });
};

export const useCreateTeam = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateTeamDTO) => teamsService.createTeam(data),
        onSuccess: () => {
            toast.success('Team created');
            queryClient.invalidateQueries({ queryKey: ['teams'] });
        },
        onError: (error: RequestErrorShape) => {
            toast.error(getErrorMessage(error, 'Failed to create team'));
        },
    });
};

export const useInviteMember = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ teamId, data }: { teamId: string; data: InviteMemberDTO }) =>
            teamsService.inviteMember(teamId, data),
        onSuccess: (data) => {
            toast.success('Member invited successfully');
            queryClient.invalidateQueries({ queryKey: ['teams', 'detail', data.id] });
        },
        onError: (error: RequestErrorShape) => {
            toast.error(getErrorMessage(error, 'Failed to invite member'));
        },
    });
};

export const useRemoveMember = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
            teamsService.removeMember(teamId, userId),
        onSuccess: (data) => {
            toast.success('Member removed');
            queryClient.invalidateQueries({ queryKey: ['teams', 'detail', data.id] });
        },
        // AUTHZ-02: 403s (e.g. removing the owner) surface as toasts, never crashes.
        onError: (error: RequestErrorShape) => {
            toast.error(getErrorMessage(error, 'Failed to remove member'));
        },
    });
};
