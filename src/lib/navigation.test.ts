import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
    NAV_GROUPS,
    NAV_ITEMS,
    NAV_URLS,
    QUICK_ACTIONS,
    ROUTE_LABELS,
    getActiveNavUrl,
} from './navigation';

/**
 * Enforcement for the T10 breadcrumb map and the no-dead-links rule.
 *
 * The card asks for a "type-level test" so an unmapped route is a compile
 * error. TypeScript cannot see the filesystem, so the closest honest
 * equivalent is this: a test that walks the real app directory and fails when
 * a route exists without a breadcrumb label, or when the shell links to a
 * route that has no page. CI makes it as blocking as a compile error.
 */

const APP_DIR = path.resolve(__dirname, '..', 'app');

function walk(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return walk(full);
        return [full];
    });
}

/** First path segment of every dashboard route that has a page. */
function dashboardRouteSegments(): Set<string> {
    const dashboardDir = path.join(APP_DIR, '(dashboard)');
    const segments = new Set<string>();
    for (const file of walk(dashboardDir)) {
        if (!file.endsWith(`page.tsx`)) continue;
        const relative = path.relative(dashboardDir, file);
        segments.add(relative.split(path.sep)[0]);
    }
    return segments;
}

/** Root-level routes (top-level directory with a page.tsx). */
function hasPageForUrl(url: string): boolean {
    // /dashboard → src/app/(dashboard)/dashboard/page.tsx
    const parts = url.split('/').filter(Boolean);
    const candidates = [
        path.join(APP_DIR, '(dashboard)', ...parts, 'page.tsx'),
        path.join(APP_DIR, '(marketing)', ...parts, 'page.tsx'),
        path.join(APP_DIR, '(auth)', ...parts, 'page.tsx'),
        path.join(APP_DIR, ...parts, 'page.tsx'),
    ];
    return candidates.some((candidate) => fs.existsSync(candidate));
}

describe('navigation config', () => {
    it('covers every dashboard route segment with a breadcrumb label', () => {
        const missing = [...dashboardRouteSegments()].filter(
            (segment) => !(segment in ROUTE_LABELS)
        );
        expect(
            missing,
            `routes without breadcrumb labels: ${missing.join(', ')} — add them to ROUTE_LABELS`
        ).toEqual([]);
    });

    it('has no dead links: every nav url resolves to a page', () => {
        const dead = NAV_URLS.filter((url) => !hasPageForUrl(url));
        expect(dead, `nav urls without a page: ${dead.join(', ')}`).toEqual([]);
    });

    it('has no dead links: every quick action resolves to a page', () => {
        const dead = QUICK_ACTIONS.filter((action) => !hasPageForUrl(action.url)).map(
            (action) => action.url
        );
        expect(dead, `quick action urls without a page: ${dead.join(', ')}`).toEqual([]);
    });

    it('keeps the five-group layout with the three destinations the brief names', () => {
        expect(NAV_GROUPS).toHaveLength(5);
        const titles = NAV_ITEMS.map((item) => item.title);
        expect(titles).toContain('Projects');
        expect(titles).toContain('Trending');
        expect(titles).toContain('Account');
        // /templates 404s — it must not come back through the config.
        expect(NAV_URLS).not.toContain('/templates');
    });

    it('has unique urls and quick-action shortcut keys', () => {
        expect(new Set(NAV_URLS).size).toBe(NAV_URLS.length);
        const keys = QUICK_ACTIONS.map((action) => action.shortcutKey);
        expect(new Set(keys).size).toBe(keys.length);
    });

    describe('getActiveNavUrl', () => {
        it('highlights the most specific destination', () => {
            expect(getActiveNavUrl('/settings/billing')).toBe('/settings/billing');
            expect(getActiveNavUrl('/settings')).toBe('/settings');
        });

        it('matches child routes of a destination', () => {
            expect(getActiveNavUrl('/projects/new')).toBe('/projects');
            expect(getActiveNavUrl('/projects/abc123')).toBe('/projects');
        });

        it('returns null outside the nav', () => {
            expect(getActiveNavUrl('/login')).toBeNull();
            expect(getActiveNavUrl('/')).toBeNull();
        });
    });
});
