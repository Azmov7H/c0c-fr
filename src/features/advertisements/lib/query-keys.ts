import type { AdvertisementsQuery } from '../types';

export const advertisementKeys = {
    all: ['advertisements'] as const,
    lists: () => [...advertisementKeys.all, 'list'] as const,
    list: (query?: AdvertisementsQuery) => [...advertisementKeys.lists(), query ?? null] as const,
    details: () => [...advertisementKeys.all, 'detail'] as const,
    detail: (id: string) => [...advertisementKeys.details(), id] as const,
    projectVideo: (projectId: string) =>
        [...advertisementKeys.all, 'project-video', projectId] as const,
    preparation: (projectId: string) =>
        [...advertisementKeys.all, 'preparation', projectId] as const,
    composition: (id: string) => [...advertisementKeys.all, 'composition', id] as const,
    preview: (id: string) => [...advertisementKeys.all, 'preview', id] as const,
    renderJobs: (id: string) => [...advertisementKeys.all, 'render-jobs', id] as const,
    renderJob: (id: string, jobId: string) =>
        [...advertisementKeys.renderJobs(id), jobId] as const,
};
