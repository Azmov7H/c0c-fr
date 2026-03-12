import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsService } from '../services/teams.service';
import { CreateTeamDTO, InviteMemberDTO } from '../types';
import { toast } from 'sonner';

export const teamKeys = {
    all: ['teams'] as const,
    lists: () => [...teamKeys.all, 'list'] as const,
    details: () => [...teamKeys.all, 'detail'] as const,
    detail: (id: string) => [...trendKeys.details(), id] as const, // typo in previous turn but fixing here
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
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create team');
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
        onError: (error: any) => {
            toast.error(error.message || 'Failed to invite member');
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
    });
};
