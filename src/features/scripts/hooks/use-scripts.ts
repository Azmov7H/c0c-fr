import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { scriptsService } from '../services/scripts.service';
import {
    CreateScriptDTO,
    UpdateScriptDTO,
    Script,
    isGenerationJobStart,
} from '../types';
import { toast } from '@/lib/toast';
import { ApiError, toApiError } from '@/lib/api-error';

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
    const t = useTranslations('scripts');

    return useMutation({
        mutationFn: (data: CreateScriptDTO) => scriptsService.createScript(data),
        onSuccess: (data) => {
            toast.success(t('toasts.created'));
            queryClient.invalidateQueries({ queryKey: scriptsKeys.list(data.projectId) });
        },
        onError: (error: unknown) => {
            toast.error(toApiError(error, t('toasts.createFailed')).message);
        },
    });
};

export const useGenerateScript = () => {
    const queryClient = useQueryClient();
    const t = useTranslations('scripts');

    return useMutation({
        // Keep the mutation pending until the durable job reaches a terminal
        // state. A 202 is a receipt, not a script.
        mutationFn: async (projectId: string): Promise<Script> => {
            const result = await scriptsService.generateScript(projectId);
            if (!isGenerationJobStart(result)) return result;

            const job = await scriptsService.waitForGenerationJob(result.jobId);
            if (job.status !== 'completed' || !job.scriptId) {
                throw new ApiError({
                    code: 'GENERATION_FAILED',
                    message: job.error ?? t('toasts.generateFailed'),
                });
            }
            return scriptsService.getScriptById(job.scriptId);
        },
        onSuccess: (data) => {
            toast.success(t('toasts.generated'));
            queryClient.invalidateQueries({ queryKey: scriptsKeys.list(data.projectId) });
            queryClient.setQueryData(scriptsKeys.detail(data.id), data);
        },
        onError: (error: unknown) => {
            toast.error(toApiError(error, t('toasts.generateFailed')).message);
        },
    });
};

export const useUpdateScript = () => {
    const queryClient = useQueryClient();
    const t = useTranslations('scripts');

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
            toast.error(toApiError(error, t('toasts.saveFailed')).message);
        },
        onSuccess: (data) => {
            toast.success(t('toasts.saved'));
            queryClient.invalidateQueries({ queryKey: scriptsKeys.list(data.projectId) });
        },
        onSettled: (_data, _error, { id }) => {
            queryClient.invalidateQueries({ queryKey: scriptsKeys.detail(id) });
        },
    });
};

export const useDeleteScript = () => {
    const queryClient = useQueryClient();
    const t = useTranslations('scripts');

    return useMutation({
        mutationFn: ({ id }: { id: string; projectId: string }) =>
            scriptsService.deleteScript(id),
        onSuccess: (_data, variables) => {
            toast.success(t('toasts.deleted'));
            queryClient.invalidateQueries({ queryKey: scriptsKeys.list(variables.projectId) });
        },
        onError: (error: unknown) => {
            toast.error(toApiError(error, t('toasts.deleteFailed')).message);
        },
    });
};