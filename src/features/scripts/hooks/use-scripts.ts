import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scriptsService } from '../services/scripts.service';
import { CreateScriptDTO, UpdateScriptDTO, Script } from '../types';
import { toast } from 'sonner';
import { toApiError } from '@/lib/api-error';

export const scriptsKeys = {
    all: ['scripts'] as const,
    lists: () => [...scriptsKeys.all, 'list'] as const,
    list: (projectId: string) => [...scriptsKeys.lists(), projectId] as const,
    details: () => [...scriptsKeys.all, 'detail'] as const,
    detail: (id: string) => [...scriptsKeys.details(), id] as const,
};

interface UpdateScriptVariables {
    id: string;
    data: UpdateScriptDTO;
}

interface UpdateScriptContext {
    previousScript: Script | undefined;
}

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
        onError: (error: unknown) => {
            toast.error(toApiError(error, 'Failed to create script').message);
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
        onError: (error: unknown) => {
            toast.error(toApiError(error, 'AI Generation failed').message);
        },
    });
};

export const useUpdateScript = () => {
    const queryClient = useQueryClient();

    return useMutation<Script, Error, UpdateScriptVariables, UpdateScriptContext>({
        mutationFn: ({ id, data }) => scriptsService.updateScript(id, data),
        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: scriptsKeys.detail(id) });
            const previousScript = queryClient.getQueryData<Script>(scriptsKeys.detail(id));
            queryClient.setQueryData<Script>(scriptsKeys.detail(id), (old) => ({
                ...(old ?? ({} as Script)),
                ...data,
            }));
            return { previousScript };
        },
        onError: (error, { id }, context) => {
            if (context?.previousScript) {
                queryClient.setQueryData(scriptsKeys.detail(id), context.previousScript);
            }
            toast.error(toApiError(error, 'Failed to save script changes').message);
        },
        onSuccess: (data) => {
            toast.success('Script saved');
            queryClient.invalidateQueries({ queryKey: scriptsKeys.list(data.projectId) });
        },
        onSettled: (_data, _error, { id }) => {
            queryClient.invalidateQueries({ queryKey: scriptsKeys.detail(id) });
        },
    });
};

export const useDeleteScript = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id }: { id: string; projectId: string }) =>
            scriptsService.deleteScript(id),
        onSuccess: (_data, variables) => {
            toast.success('Script deleted');
            queryClient.invalidateQueries({ queryKey: scriptsKeys.list(variables.projectId) });
        },
        onError: (error: unknown) => {
            toast.error(toApiError(error, 'Failed to delete script').message);
        },
    });
};