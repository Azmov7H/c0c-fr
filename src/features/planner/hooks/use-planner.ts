import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plannerService } from '../services/planner.service';
import { toast } from 'sonner';
import type { PlannerEvent } from '../services/planner.service';

export const plannerKeys = {
    all: ['planner'] as const,
    list: (filters: Record<string, unknown>) => [...plannerKeys.all, 'list', filters] as const,
    detail: (id: string) => [...plannerKeys.all, 'detail', id] as const,
};

export function usePlannerEvents(params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
    projectId?: string;
}) {
    return useQuery({
        queryKey: plannerKeys.list(params || {}),
        queryFn: () => plannerService.getEvents(params),
    });
}

export function useCreatePlannerEvent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: Partial<PlannerEvent>) => plannerService.create(dto),
        onSuccess: () => {
            toast.success('Event created');
            queryClient.invalidateQueries({ queryKey: plannerKeys.all });
        },
    });
}

export function useUpdatePlannerEvent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<PlannerEvent> }) =>
            plannerService.update(id, data),
        onSuccess: () => {
            toast.success('Event updated');
            queryClient.invalidateQueries({ queryKey: plannerKeys.all });
        },
    });
}

export function useDeletePlannerEvent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => plannerService.delete(id),
        onSuccess: () => {
            toast.success('Event deleted');
            queryClient.invalidateQueries({ queryKey: plannerKeys.all });
        },
    });
}
