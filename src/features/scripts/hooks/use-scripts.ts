import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scriptsService } from '../services/scripts.service';
import { CreateScriptDTO, UpdateScriptDTO } from '../types';
import { toast } from 'sonner';

export const scriptsKeys = {
    all: ['scripts'] as const,
    lists: () => [...scriptsKeys.all, 'list'] as const,
    list: (projectId: string) => [...scriptsKeys.lists(), projectId] as const,
    details: () => [...scriptsKeys.all, 'detail'] as const,
    detail: (id: string) => [...scriptsKeys.details(), id] as const,
};

export const useProjectScripts = (projectId: string) => {
    return useQuery({
        queryKey: scriptsKeys.list(projectId),
        queryFn: () => scriptsService.getProjectScripts(projectId),
        enabled: !!projectId,
    });
};

export const useScript = (id: string) => {
    return useQuery({
        queryKey: scriptsKeys.detail(id),
        queryFn: () => scriptsService.getScriptById(id),
        enabled: !!id,
    });
};

export const useCreateScript = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateScriptDTO) => scriptsService.createScript(data),
        onSuccess: (data) => {
            toast.success('Script created successfully');
            queryClient.invalidateQueries({ queryKey: scriptsKeys.list(data.projectId) });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create script');
        },
    });
};

export const useGenerateScript = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (projectId: string) => scriptsService.generateScript(projectId),
        onSuccess: (data) => {
            toast.success('AI Script generated successfully! ✨');
            queryClient.invalidateQueries({ queryKey: scriptsKeys.list(data.projectId) });
            queryClient.setQueryData(scriptsKeys.detail(data.id), data);
        },
        onError: (error: any) => {
            toast.error(error.message || 'AI Generation failed');
        },
    });
};

export const useUpdateScript = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateScriptDTO }) =>
            scriptsService.updateScript(id, data),
        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: scriptsKeys.detail(id) });
            const previousScript = queryClient.getQueryData(scriptsKeys.detail(id));
            queryClient.setQueryData(scriptsKeys.detail(id), (old: any) => ({
                ...old,
                ...data,
            }));
            return { previousScript };
        },
        onError: (err, { id }, context: any) => {
            if (context?.previousScript) {
                queryClient.setQueryData(scriptsKeys.detail(id), context.previousScript);
            }
            toast.error('Failed to save script changes');
        },
        onSuccess: (data) => {
            toast.success('Script saved');
            queryClient.invalidateQueries({ queryKey: scriptsKeys.list(data.projectId) });
        },
        onSettled: (data, error, { id }) => {
            queryClient.invalidateQueries({ queryKey: scriptsKeys.detail(id) });
        },
    });
};

export const useDeleteScript = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
            scriptsService.deleteScript(id),
        onSuccess: (_, variables) => {
            toast.success('Script deleted');
            queryClient.invalidateQueries({ queryKey: scriptsKeys.list(variables.projectId) });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete script');
        },
    });
};
