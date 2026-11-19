import { describe, expect, it } from 'vitest';

import ar from '../../../messages/ar/dashboard.json';
import en from '../../../messages/en/dashboard.json';
import arDataState from '../../../messages/ar/dataState.json';
import enDataState from '../../../messages/en/dataState.json';
import arBilling from '../../../messages/ar/billing.json';
import enBilling from '../../../messages/en/billing.json';
import { hardcodedCopy } from '../../../tests/helpers/hardcoded-copy';

/**
 * AR-027 — the dashboard extraction.
 *
 * The dashboard was 100% English. This suite proves the same four things
 * AR-022/023/024/026 proved for their surfaces:
 *
 *   1. the SURFACE reads its copy from the catalog — the shared scanner fails
 *      on English still written in the source;
 *   2. the ENGLISH did not change — the catalog carries, verbatim, the
 *      sentences the screen rendered before the extraction;
 *   3. the ARABIC is really Arabic — nothing is empty, nothing is a copy of
 *      its English counterpart;
 *   4. the PLACEHOLDERS survive the translation — `{count}`, `{value}`,
 *      `{date}`, `{state}`, `{widget}` … are fill-ins, and an Arabic sentence
 *      that loses one renders a literal brace.
 *
 * The shared `DataState` defaults and the `UpgradePrompt` CTA live in their
 * own namespaces, so their catalogs are gated here too: they are the two
 * pieces of the dashboard the screen does not own but cannot do without.
 */

/** The surface this batch owns. */
const SURFACE = [
    'src/features/dashboard/components/dashboard-view.tsx',
    'src/features/dashboard/components/dashboard-widgets.tsx',
    'src/features/dashboard/components/dashboard-data-state.tsx',
    'src/features/dashboard/components/widget-settings.tsx',
    'src/features/dashboard/components/creation-trend-chart.tsx',
    'src/features/dashboard/hooks/use-dashboard.ts',
];

/** Platform names and plan names are proper nouns; they are not translated. */
const ALLOWED = ['YouTube', 'TikTok', 'Instagram', 'Facebook', 'Pro', 'Studio'];

type Catalog = typeof en;

/**
 * The English the dashboard rendered BEFORE the extraction (AR-027), verbatim.
 *
 * This is the regression floor in test form: if the catalog's English is
 * edited, this test fails and the edit has to be deliberate.
 */
const ENGLISH_FLOOR: Pick<
    Catalog,
    | 'metadata'
    | 'header'
    | 'metrics'
    | 'statuses'
    | 'projects'
    | 'analytics'
    | 'widgets'
    | 'health'
    | 'hidden'
    | 'footer'
    | 'settings'
    | 'chart'
> = {
    metadata: {
        title: 'Dashboard',
        description:
            'Overview of your content creation workspace — projects, scripts, and performance metrics.',
    },
    header: {
        title: 'Dashboard',
        description: 'Your projects, trends and activity at a glance.',
        newProject: 'New Project',
    },
    metrics: {
        heading: 'Key metrics',
        projects: 'Projects',
        scripts: 'Scripts',
        thumbnails: 'Thumbnails',
        media: 'Media',
        inProgress: '{count} in progress',
        generated: 'Generated',
        designed: 'Designed',
        inLibrary: 'In your library',
        error: 'Your key metrics could not be loaded.',
    },
    statuses: {
        all: 'All',
        draft: 'Draft',
        processing: 'In progress',
        completed: 'Completed',
        archived: 'Archived',
    },
    projects: {
        heading: 'Projects',
        filterAria: 'Filter projects by status',
        viewAll: 'View all',
        continue: 'Continue where you left off',
        resume: 'Resume',
        error: 'Your projects could not be loaded.',
        emptyAllTitle: 'Create your first project',
        emptyStatusTitle: 'No {status} projects',
        emptyAllDescription:
            'Projects hold your scripts, thumbnails, audio and SEO in one place.',
        emptyStatusDescription:
            'Nothing matches this status yet. Try another filter or create a project.',
        emptyAction: 'Create your first project',
        listAria: 'Projects',
    },
    analytics: {
        description: 'Projects created over the last seven days',
        lockedTitle: 'Creation analytics is available on Pro and Studio plans.',
        lockedDescription:
            'Upgrade to unlock the creation-trend chart and keep this widget visible.',
        error: 'The creation trend could not be loaded.',
        emptyTitle: 'No creation activity yet',
        emptyDescription: 'Create projects this week and the trend appears here.',
    },
    widgets: {
        stats: 'Key metrics',
        projects: 'Projects',
        status: 'Project status',
        platforms: 'Platform split',
        trending: 'Trending for you',
        activity: 'Recent activity',
        upcoming: 'Upcoming content',
        quickActions: 'Quick actions',
        analytics: 'Creation trend',
        health: 'System status',
        healthDescription: 'Live dependency status',
    },
    health: {
        unavailable: 'Status unavailable — the API could not be reached',
        ready: 'API ready — database connected',
        degraded: 'Degraded — database {state}',
        retry: 'Retry',
        database: {
            connected: 'connected',
            connecting: 'connecting',
            disconnected: 'disconnected',
        },
    },
    hidden: {
        preferencesError: 'Your saved layout could not be loaded; showing the default layout.',
        title: 'All widgets are hidden',
        description: 'Bring them back from Customise — nothing is lost.',
        showAll: 'Show all widgets',
    },
    footer: {
        prompt: 'Want a different overview?',
        link: 'Update your interests',
        tail: 'to personalise trending and defaults.',
    },
    settings: {
        trigger: 'Customise',
        title: 'Dashboard widgets',
        description:
            'Hidden widgets stay out of the way but remain available here. Your layout is saved to your account.',
        showAria: 'Show {widget}',
        showAll: 'Show all widgets',
    },
    chart: {
        series: 'Projects created',
        summaryEmpty: 'No projects were created in the last seven days.',
        summary:
            '{count, plural, one {{value} project created} other {{value} projects created}} in the last seven days.',
        busiest: 'Busiest day: {date} with {count}.',
        viewTable: 'View as table',
        caption: 'Projects created per day, last seven days',
        date: 'Date',
        projects: 'Projects',
    },
};

const PLACEHOLDER = /\{(\w+)\}/g;

function placeholders(value: string): string[] {
    return [...value.matchAll(PLACEHOLDER)].map((match) => match[1]).sort();
}

function flatten(value: unknown, prefix = ''): Record<string, string> {
    if (typeof value === 'string') return { [prefix]: value };
    if (Array.isArray(value)) return {};
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).flatMap(([key, nested]) =>
                key.startsWith('@')
                    ? []
                    : Object.entries(flatten(nested, prefix ? `${prefix}.${key}` : key))
            )
        );
    }
    return {};
}

describe('AR-027 the dashboard extraction', () => {
    it('the surface has no English copy left in the source', () => {
        const leftovers = SURFACE.flatMap((file) =>
            hardcodedCopy(file, { allowed: ALLOWED }).map((text) => `${file}: ${text}`)
        );
        expect(leftovers).toEqual([]);
    });

    it('the English is the copy the screen rendered before the extraction', () => {
        const catalog = flatten(en);
        for (const [key, expected] of Object.entries(flatten(ENGLISH_FLOOR))) {
            expect(catalog[key], key).toBe(expected);
        }
    });

    it('the Arabic is really Arabic: nothing empty, nothing a copy of the English', () => {
        const english = flatten(en);
        const arabic = flatten(ar);
        expect(Object.keys(arabic).sort()).toEqual(Object.keys(english).sort());

        for (const [key, value] of Object.entries(arabic)) {
            expect(value, `ar ${key} is empty`).not.toBe('');
            // Brand and plan names are intentionally the same in both languages.
            const sharedByDesign = ALLOWED.some((entry) => value.includes(entry));
            if (!sharedByDesign) {
                expect(value, `ar ${key} is the English string`).not.toBe(english[key]);
            }
        }
    });

    it('the shared state and upsell catalogs are real Arabic too', () => {
        for (const [english, arabic] of [
            [enDataState, arDataState],
            [enBilling, arBilling],
        ] as const) {
            expect(Object.keys(flatten(arabic)).length).toBeGreaterThan(0);
            for (const [key, value] of Object.entries(flatten(arabic))) {
                expect(value, `ar ${key} is empty`).not.toBe('');
                expect(value, `ar ${key} is the English string`).not.toBe(
                    flatten(english)[key]
                );
            }
        }
    });

    it('every placeholder survives the translation', () => {
        const english = flatten(en);
        const arabic = flatten(ar);
        for (const [key, value] of Object.entries(english)) {
            // Sets, not lists: an Arabic plural carries more branches than the
            // English one, so `{value}` may appear more than once. What must
            // not happen is a fill-in that the Arabic sentence LOST.
            expect(new Set(placeholders(arabic[key])), `ar ${key}`).toEqual(
                new Set(placeholders(value))
            );
        }

        expect(placeholders(arBilling.upgrade.usage)).toEqual(
            placeholders(enBilling.upgrade.usage)
        );
        expect(placeholders(arBilling.upgrade.resets)).toEqual(
            placeholders(enBilling.upgrade.resets)
        );
    });

    it('never formats a displayed number with ICU # (Arabic-Indic digits)', () => {
        // `#` inside a plural renders with the provider's numbering system. The
        // dashboard passes preformatted values instead, so no catalog value
        // may contain a bare `#` outside a class-like string.
        for (const [key, value] of Object.entries(flatten(en))) {
            expect(value, `en ${key} uses #`).not.toMatch(/#/);
        }
        for (const [key, value] of Object.entries(flatten(ar))) {
            expect(value, `ar ${key} uses #`).not.toMatch(/#/);
        }
    });
});
