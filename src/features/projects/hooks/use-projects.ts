import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
    type QueryKey,
} from '@tanstack/react-query';
import { toast } from '@/lib/toast';

import type { PaginatedResponse, Project } from '@/types';
import { toApiError } from '@/lib/api-error';

import {
    projectsService,
    type CreateProjectDTO,
    type ProjectsQuery,
    type UpdateProjectDTO,
} from '../services/projects.service';
import { projectKeys } from '../lib/query-keys';

export { projectKeys };

type ListSnapshot = Array<[QueryKey, PaginatedResponse<Project> | undefined]>;

function snapshotLists(queryClient: ReturnType<typeof useQueryClient>): ListSnapshot {
    return queryClient.getQueriesData<PaginatedResponse<Project>>({
        queryKey: projectKeys.all,
    });
}

function restoreLists(
    queryClient: ReturnType<typeof useQueryClient>,
    snapshot: ListSnapshot | undefined
): void {
    for (const [key, data] of snapshot ?? []) {
        queryClient.setQueryData(key, data);
    }
}

/**
 * Applies `update` to a project wherever it is cached, leaving other list
 * metadata untouched. Rollback is a wholesale snapshot restore: merging a
 * previous copy back in is how two optimistic writes lose one another.
 */
function patchCachedProject(
    queryClient: ReturnType<typeof useQueryClient>,
    id: string,
    update: (project: Project) => Project
): void {
    queryClient.setQueriesData<PaginatedResponse<Project>>(
        { queryKey: projectKeys.all },
        (current) => {
            if (!current || !Array.isArray(current.data)) return current;
            return {
                ...current,
                data: current.data.map((project) => (project._id === id ? update(project) : project)),
            };
        }
    );
    queryClient.setQueryData<Project>(projectKeys.detail(id), (current) =>
        current ? update(current) : current
    );
}

export function useProjects(query?: ProjectsQuery, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: projectKeys.list(query),
        queryFn: () => projectsService.getAll(query),
        placeholderData: keepPreviousData,
        // The command palette fetches the first page lazily (only while open).
        enabled: options?.enabled ?? true,
    });
}

export function useProject(id: string) {
    return useQuery({
        queryKey: projectKeys.detail(id),
        queryFn: () => projectsService.getById(id),
        enabled: !!id,
    });
}

/**
 * Creation is optimistic so the list reflects the new card before the round
 * trip. The wizard navigates on success, but the dashboard and list are already
 * correct if the user backs out of the workspace immediately.
 */
export function useCreateProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateProjectDTO) => projectsService.create(data),
        onMutate: async (data) => {
            await queryClient.cancelQueries({ queryKey: projectKeys.all });
            const previous = snapshotLists(queryClient);

            const now = new Date().toISOString();
            const optimistic: Project = {
                _id: `optimistic-${now}`,
                title: data.title,
                description: data.description,
                idea: data.idea,
                platform: data.platform,
                tone: data.tone,
                status: 'draft',
                userId: '',
                createdAt: now,
                updatedAt: now,
            };

            queryClient.setQueriesData<PaginatedResponse<Project>>(
                { queryKey: projectKeys.all },
                (current) => {
                    if (!current || !Array.isArray(current.data)) return current;
                    return {
                        ...current,
                        data: [optimistic, ...current.data],
                        meta: current.meta
                            ? { ...current.meta, total: current.meta.total + 1 }
                            : current.meta,
                    };
                }
            );

            return { previous, optimisticId: optimistic._id };
        },
        onSuccess: (created, _data, context) => {
            queryClient.setQueriesData<PaginatedResponse<Project>>(
                { queryKey: projectKeys.all },
                (current) => {
                    if (!current || !Array.isArray(current.data)) return current;
                    return {
                        ...current,
                        data: current.data.map((project) =>
                            project._id === context?.optimisticId ? created : project
                        ),
                    };
                }
            );
            queryClient.setQueryData(projectKeys.detail(created._id), created);
        },
        onError: (_error, _data, context) => {
            queryClient.setQueriesData<PaginatedResponse<Project>>(
                { queryKey: projectKeys.all },
                (current) => {
                    if (!current || !Array.isArray(current.data)) return current;
                    return {
                        ...current,
                        data: current.data.filter(
                            (project) => project._id !== context?.optimisticId
                        ),
                        meta:
                            current.meta && context
                                ? { ...current.meta, total: Math.max(0, current.meta.total - 1) }
                                : current.meta,
                    };
                }
            );
            if (context?.previous) restoreLists(queryClient, context.previous);
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: projectKeys.all });
        },
    });
}

export interface UpdateProjectVariables {
    id: string;
    data: UpdateProjectDTO;
    successMessage?: string;
}

export function useUpdateProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: UpdateProjectVariables) =>
            projectsService.update(id, data),
        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: projectKeys.all });
            const previous = snapshotLists(queryClient);
            const previousDetail = queryClient.getQueryData<Project>(projectKeys.detail(id));

            patchCachedProject(queryClient, id, (project) => ({ ...project, ...data }));
            return { previous, previousDetail };
        },
        onSuccess: (updated, variables, context) => {
            queryClient.setQueryData(projectKeys.detail(updated._id), updated);
            if (context?.previousDetail) {
                patchCachedProject(queryClient, updated._id, () => updated);
            }
            toast.success(variables.successMessage ?? 'Project updated.');
        },
        onError: (error, variables, context) => {
            restoreLists(queryClient, context?.previous);
            if (context?.previousDetail) {
                queryClient.setQueryData(projectKeys.detail(variables.id), context.previousDetail);
            }
            toast.error(toApiError(error, 'Failed to update project.').message);
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: projectKeys.all });
        },
    });
}

/**
 * The server soft-deletes: the row stays, marked `isDeleted` and `archived`, so
 * "delete" is not a hard destroy. Copy says "removed from your workspace" rather
 * than promising an in-app restore the API does not offer.
 */
export function useDeleteProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => projectsService.delete(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: projectKeys.all });
            const previous = snapshotLists(queryClient);
            const previousDetail = queryClient.getQueryData<Project>(projectKeys.detail(id));

            queryClient.setQueriesData<PaginatedResponse<Project>>(
                { queryKey: projectKeys.all },
                (current) => {
                    if (!current || !Array.isArray(current.data)) return current;
                    return {
                        ...current,
                        data: current.data.filter((project) => project._id !== id),
                        meta: current.meta
                            ? { ...current.meta, total: Math.max(0, current.meta.total - 1) }
                            : current.meta,
                    };
                }
            );
            queryClient.removeQueries({ queryKey: projectKeys.detail(id) });

            return { previous, previousDetail };
        },
        onSuccess: () => {
            toast.success('Project removed from your workspace.');
        },
        onError: (error, id, context) => {
            restoreLists(queryClient, context?.previous);
            if (context?.previousDetail) {
                queryClient.setQueryData(projectKeys.detail(id), context.previousDetail);
            }
            toast.error(toApiError(error, 'Failed to remove project.').message);
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: projectKeys.all });
        },
    });
}
