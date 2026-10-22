import type { ProjectStatus } from '@/types';

/**
 * The transition graph from the T16 card: draft → processing → completed →
 * archived, with archive reachable from any live state and restore returning to
 * draft. The backend accepts any enum value, so this is the only place that
 * prevents a nonsensical jump.
 */
export const ALLOWED_TRANSITIONS: Record<ProjectStatus, readonly ProjectStatus[]> = {
    draft: ['processing', 'completed', 'archived'],
    processing: ['completed', 'draft', 'archived'],
    completed: ['draft', 'archived'],
    archived: ['draft'],
};

export const nextStatuses = (status: ProjectStatus): readonly ProjectStatus[] =>
    ALLOWED_TRANSITIONS[status];
