import type { Platform, ProjectStatus } from '@/types';

import type { ProjectsQuery } from '../services/projects.service';
import { PROJECT_PLATFORMS, PROJECT_STATUSES } from './project-constants';

/**
 * URL is the source of truth for the list's filters (T15 §1).
 *
 * A filtered view has to survive a refresh and be shareable, so every control
 * writes to the query string and the query key is derived from the parsed
 * result. Parsing is strict about the enum vocabulary and lenient about
 * everything else: an unknown `status` chip is dropped rather than crashing a
 * bookmarked URL.
 */

export const PROJECT_VIEWS = ['grid', 'table'] as const;
export type ProjectView = (typeof PROJECT_VIEWS)[number];

export interface ProjectSort {
    value: 'updatedAt' | 'createdAt' | 'title' | 'status';
    label: string;
    order: 'asc' | 'desc';
}

export const PROJECT_SORTS: ProjectSort[] = [
    { value: 'updatedAt', label: 'Recent activity', order: 'desc' },
    { value: 'createdAt', label: 'Newest created', order: 'desc' },
    { value: 'title', label: 'Title A–Z', order: 'asc' },
    { value: 'status', label: 'Status', order: 'asc' },
];

export const DEFAULT_SORT: ProjectSort['value'] = 'updatedAt';
export const PROJECT_PAGE_SIZE = 12;

export interface ProjectFilters {
    q: string;
    statuses: ProjectStatus[];
    platforms: Platform[];
    sort: ProjectSort['value'];
    page: number;
}

export const EMPTY_FILTERS: ProjectFilters = {
    q: '',
    statuses: [],
    platforms: [],
    sort: DEFAULT_SORT,
    page: 1,
};

function splitList(value: string | null): string[] {
    if (!value) return [];
    return [...new Set(value.split(',').map((part) => part.trim()).filter(Boolean))];
}

export function parseProjectFilters(params: URLSearchParams): ProjectFilters {
    const statuses = splitList(params.get('status')).filter((value): value is ProjectStatus =>
        (PROJECT_STATUSES as readonly string[]).includes(value)
    );
    const platforms = splitList(params.get('platform')).filter((value): value is Platform =>
        (PROJECT_PLATFORMS as readonly string[]).includes(value)
    );

    const requestedSort = params.get('sort');
    const sort = PROJECT_SORTS.some((option) => option.value === requestedSort)
        ? (requestedSort as ProjectSort['value'])
        : DEFAULT_SORT;

    const rawPage = Number(params.get('page'));
    const page = Number.isInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, 10_000) : 1;

    return {
        q: (params.get('q') ?? '').trim().slice(0, 200),
        statuses,
        platforms,
        sort,
        page,
    };
}

/** Serialised without the leading `?`; defaults are omitted so URLs stay short. */
export function serializeProjectFilters(filters: ProjectFilters): string {
    const params = new URLSearchParams();

    if (filters.q) params.set('q', filters.q);
    if (filters.statuses.length) params.set('status', filters.statuses.join(','));
    if (filters.platforms.length) params.set('platform', filters.platforms.join(','));
    if (filters.sort !== DEFAULT_SORT) params.set('sort', filters.sort);
    if (filters.page > 1) params.set('page', String(filters.page));

    return params.toString();
}

/** True when a result set is empty because of the user's inputs, not the account. */
export function hasProjectFilters(filters: ProjectFilters): boolean {
    return Boolean(filters.q) || filters.statuses.length > 0 || filters.platforms.length > 0;
}

export function sortOrderFor(sort: ProjectFilters['sort']): 'asc' | 'desc' {
    return PROJECT_SORTS.find((option) => option.value === sort)?.order ?? 'desc';
}

export function filtersToQuery(filters: ProjectFilters): ProjectsQuery {
    return {
        page: filters.page,
        limit: PROJECT_PAGE_SIZE,
        ...(filters.q ? { search: filters.q } : {}),
        ...(filters.statuses.length ? { status: filters.statuses.join(',') } : {}),
        ...(filters.platforms.length ? { platform: filters.platforms.join(',') } : {}),
        sortBy: filters.sort,
        sortOrder: sortOrderFor(filters.sort),
    };
}

export function toggleValue<T>(values: T[], value: T): T[] {
    return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
}

export function filtersAreEqual(a: ProjectFilters, b: ProjectFilters): boolean {
    return (
        a.q === b.q &&
        a.sort === b.sort &&
        a.page === b.page &&
        a.statuses.join(',') === b.statuses.join(',') &&
        a.platforms.join(',') === b.platforms.join(',')
    );
}
