import { useQuery } from '@tanstack/react-query';

import { mediaService } from '../services/media.service';

export const mediaKeys = {
    all: ['media'] as const,
    lists: () => [...mediaKeys.all, 'list'] as const,
    list: (projectId: string) => [...mediaKeys.lists(), projectId] as const,
};

export function useProjectMedia(projectId: string) {
    return useQuery({
        queryKey: mediaKeys.list(projectId),
        queryFn: () => mediaService.getMedia({ projectId, limit: 50 }),
        enabled: !!projectId,
    });
}
