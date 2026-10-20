import { describe, expect, it } from 'vitest';

import {
    EMPTY_FILTERS,
    filtersToQuery,
    hasProjectFilters,
    parseProjectFilters,
    serializeProjectFilters,
} from './project-filters';

describe('project filter URL state', () => {
    it('round-trips the shareable filter set', () => {
        const query =
            'q=ai&status=draft,completed&platform=tiktok&sort=title&page=2';
        const parsed = parseProjectFilters(new URLSearchParams(query));

        expect(parsed).toEqual({
            q: 'ai',
            statuses: ['draft', 'completed'],
            platforms: ['tiktok'],
            sort: 'title',
            page: 2,
        });
        expect(serializeProjectFilters(parsed)).toBe(
            'q=ai&status=draft%2Ccompleted&platform=tiktok&sort=title&page=2'
        );
        expect(parseProjectFilters(new URLSearchParams(serializeProjectFilters(parsed)))).toEqual(
            parsed
        );
    });

    it('drops unknown enum values instead of failing a bookmarked URL', () => {
        const parsed = parseProjectFilters(
            new URLSearchParams('status=deleted,draft&platform=shorts&sort=password&page=-4')
        );

        expect(parsed.statuses).toEqual(['draft']);
        expect(parsed.platforms).toEqual([]);
        expect(parsed.sort).toBe('updatedAt');
        expect(parsed.page).toBe(1);
    });

    it('omits defaults from the URL', () => {
        expect(serializeProjectFilters(EMPTY_FILTERS)).toBe('');
    });

    it('maps filters to the server query with the sort order the option declares', () => {
        expect(
            filtersToQuery({
                q: 'video',
                statuses: ['draft', 'archived'],
                platforms: ['youtube', 'tiktok'],
                sort: 'title',
                page: 3,
            })
        ).toEqual({
            page: 3,
            limit: 12,
            search: 'video',
            status: 'draft,archived',
            platform: 'youtube,tiktok',
            sortBy: 'title',
            sortOrder: 'asc',
        });
    });

    it('distinguishes filters from an empty account', () => {
        expect(hasProjectFilters(EMPTY_FILTERS)).toBe(false);
        expect(hasProjectFilters({ ...EMPTY_FILTERS, q: 'x' })).toBe(true);
        expect(hasProjectFilters({ ...EMPTY_FILTERS, statuses: ['draft'] })).toBe(true);
        expect(hasProjectFilters({ ...EMPTY_FILTERS, platforms: ['tiktok'] })).toBe(true);
        expect(hasProjectFilters({ ...EMPTY_FILTERS, sort: 'title', page: 2 })).toBe(false);
    });
});
