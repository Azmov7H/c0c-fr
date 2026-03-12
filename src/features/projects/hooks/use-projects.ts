import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { projectsService, CreateProjectDTO, UpdateProjectDTO, ProjectsQuery } from '../services/projects.service';

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
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Failed to create project.');
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
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Failed to update project.');
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
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Failed to delete project.');
        },
    });
}
