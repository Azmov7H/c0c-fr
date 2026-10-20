import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { projectsService, CreateProjectDTO, UpdateProjectDTO, ProjectsQuery } from '../services/projects.service';
import { projectKeys } from '../lib/query-keys';
import { toApiError } from '@/lib/api-error';

export { projectKeys };

export function useProjects(query?: ProjectsQuery, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: projectKeys.list(query),
        queryFn: () => projectsService.getAll(query),
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

export function useCreateProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateProjectDTO) => projectsService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: projectKeys.all });
            toast.success('Project created successfully!');
        },
        onError: (error: unknown) => {
            toast.error(toApiError(error, 'Failed to create project.').message);
        },
    });
}

export function useUpdateProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateProjectDTO }) =>
            projectsService.update(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: projectKeys.all });
            queryClient.setQueryData(projectKeys.detail(data._id), data);
            toast.success('Project updated successfully!');
        },
        onError: (error: unknown) => {
            toast.error(toApiError(error, 'Failed to update project.').message);
        },
    });
}

export function useDeleteProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => projectsService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: projectKeys.all });
            toast.success('Project deleted successfully.');
        },
        onError: (error: unknown) => {
            toast.error(toApiError(error, 'Failed to delete project.').message);
        },
    });
}
