import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { projectsService, CreateProjectDTO, UpdateProjectDTO, ProjectsQuery } from '../services/projects.service';
import { toApiError } from '@/lib/api-error';

const PROJECTS_KEY = 'projects';

export function useProjects(query?: ProjectsQuery) {
    return useQuery({
        queryKey: [PROJECTS_KEY, query],
        queryFn: () => projectsService.getAll(query),
    });
}

export function useProject(id: string) {
    return useQuery({
        queryKey: [PROJECTS_KEY, id],
        queryFn: () => projectsService.getById(id),
        enabled: !!id,
    });
}

export function useCreateProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateProjectDTO) => projectsService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [PROJECTS_KEY] });
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
            queryClient.invalidateQueries({ queryKey: [PROJECTS_KEY] });
            queryClient.setQueryData([PROJECTS_KEY, data._id], data);
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
            queryClient.invalidateQueries({ queryKey: [PROJECTS_KEY] });
            toast.success('Project deleted successfully.');
        },
        onError: (error: unknown) => {
            toast.error(toApiError(error, 'Failed to delete project.').message);
        },
    });
}
