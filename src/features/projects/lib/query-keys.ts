import type { ProjectsQuery } from '../services/projects.service';

/**
 * One key factory shared by the client hooks and the RSC prefetch (T14).
 *
 * Prefetching with a hand-written key is the classic hydration bug: the data
 * lands under a key no hook reads, so the client fetches it again and the
 * server render is wasted. Server and client import this file, so there is one
 * definition of every key.
 */
export const projectKeys = {
    all: ['projects'] as const,
    lists: () => [...projectKeys.all, 'list'] as const,
    list: (query?: ProjectsQuery) => [...projectKeys.lists(), query ?? null] as const,
    details: () => [...projectKeys.all, 'detail'] as const,
    detail: (id: string) => [...projectKeys.details(), id] as const,
};
