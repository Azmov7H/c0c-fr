import type { ProjectsQuery } from '@/features/projects/services/projects.service';
import type { TrendWindow } from '@/features/trends/types';

/**
 * One definition per dashboard query argument, imported by both the RSC
 * prefetch and the client hooks. Keys are built from these objects, so the
 * serialised key is identical on both sides (T14 §4: no inline string keys).
 */
export const DASHBOARD_PROJECTS_QUERY: ProjectsQuery = {
    limit: 24,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
};

export const DASHBOARD_ACTIVITY_LIMIT = 6;

export const DASHBOARD_TRENDS_WINDOW: TrendWindow = 7;
