import { describe, expect, it } from 'vitest';

import arNavigation from '../../messages/ar/navigation.json';
import enNavigation from '../../messages/en/navigation.json';
import { hardcodedCopy } from '../../tests/helpers/hardcoded-copy';
import { NAV_GROUPS, QUICK_ACTIONS, ROUTE_LABELS, ROUTE_LABEL_KEYS } from './navigation';

/**
 * AR-029 — the app shell's navigation.
 *
 * The same four proofs the earlier extractions made:
 *
 *   1. the SURFACE reads its copy from the catalog — the shared scanner fails
 *      on English still written in the source;
 *   2. the ENGLISH is verbatim what the shell rendered before the extraction;
 *   3. the ARABIC is really Arabic — nothing empty, nothing a copy of English;
 *   4. every placeholder survives, and no `@dynamic` key is a ghost.
 *
 * The nav config keeps its English `title`/`label` FIELDS as data (routes,
 * tests, the no-dead-links gate and the floor). Those are asserted here too:
 * a change to a route's English label has to be deliberate.
 */
const SURFACE = [
    'src/components/layout/sidebar.tsx',
    'src/components/layout/header.tsx',
    'src/components/layout/command-menu.tsx',
    'src/components/layout/user-button.tsx',
    'src/components/layout/connection-banner.tsx',
    'src/components/layout/app-shell.tsx',
];

type Catalog = typeof enNavigation;

/** The English the shell rendered before AR-029 (the regression floor). */
const FLOOR = {
    groups: {
        overview: 'Overview',
        contentEngine: 'Content Engine',
        studioTools: 'Studio Tools',
        insights: 'Insights',
        management: 'Management',
    },
    items: {
        dashboard: 'Dashboard',
        projects: 'Projects',
        advertisements: 'Advertisements',
        thumbnails: 'Thumbnails',
        mediaLibrary: 'Media Library',
        trending: 'Trending',
        analytics: 'Analytics',
        planner: 'Planner',
        seoAnalyzer: 'SEO Analyzer',
        team: 'Team',
        billingPlan: 'Billing & Plan',
        account: 'Account',
    },
    routes: {
        new: 'New',
        scripts: 'Scripts',
        titles: 'Titles',
        hashtags: 'Hashtags',
        audio: 'Audio Studio',
        onboarding: 'Get started',
    },
    quickActions: {
        newProject: 'New Project',
        newScript: 'New Script',
        newThumbnail: 'New Thumbnail',
        newPlannerEvent: 'New Planner Event',
        inviteMember: 'Invite a Member',
    },
    sidebar: { primary: 'Primary' },
    header: { toggleTheme: 'Toggle theme' },
    palette: {
        placeholder: 'Search pages, actions, projects...',
        noResults: 'No results found.',
        headingActions: 'Actions',
        headingProjects: 'Projects',
        toggleTheme: 'Toggle Theme',
        signOut: 'Sign out',
    },
    userMenu: {
        accountMenu: 'Account menu',
        profile: 'Profile',
        accountSettings: 'Account settings',
        billingPlan: 'Billing & Plan',
        theme: 'Theme',
        light: 'Light',
        dark: 'Dark',
        system: 'System',
        signOut: 'Sign out',
        signingOut: 'Signing out...',
    },
    connection: {
        backOnline: 'Back online',
        offline: "You're offline — changes may not save",
        reconnecting: 'Reconnecting to realtime updates…',
    },
    shell: { loadingSession: 'Loading session' },
} satisfies Omit<Catalog, '@dynamic'>;

function flatten(value: unknown, prefix = ''): Record<string, string> {
    const out: Record<string, string> = {};
    if (typeof value !== 'object' || value === null) return { [prefix]: String(value) };
    for (const [key, child] of Object.entries(value)) {
        if (prefix === '' && key.startsWith('@')) continue;
        Object.assign(out, flatten(child, prefix ? `${prefix}.${key}` : key));
    }
    return out;
}

const PLACEHOLDER = /\{(\w+)\}/g;
function placeholders(value: string): string[] {
    return [...value.matchAll(PLACEHOLDER)].map((match) => match[1]).sort();
}

describe('AR-029 the shell navigation extraction', () => {
    it('the surface has no English copy left in the source', () => {
        const leftovers = SURFACE.flatMap((file) =>
            hardcodedCopy(file).map((text) => `${file}: ${text}`)
        );
        expect(leftovers).toEqual([]);
    });

    it('the English catalog is what the shell rendered before the extraction', () => {
        expect(flatten(enNavigation)).toEqual(flatten(FLOOR));
    });

    it('the English nav config data did not change', () => {
        expect(NAV_GROUPS.map((group) => group.label)).toEqual([
            'Overview',
            'Content Engine',
            'Studio Tools',
            'Insights',
            'Management',
        ]);
        expect(QUICK_ACTIONS.map((action) => action.title)).toEqual([
            'New Project',
            'New Script',
            'New Thumbnail',
            'New Planner Event',
            'Invite a Member',
        ]);
        expect(ROUTE_LABELS.onboarding).toBe('Get started');
        expect(ROUTE_LABELS.audio).toBe('Audio Studio');
    });

    it('exposes Advertisements under Content Engine', () => {
        const group = NAV_GROUPS.find((item) => item.label === 'Content Engine');
        expect(group?.items).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    title: 'Advertisements',
                    titleKey: 'items.advertisements',
                    url: '/advertisements',
                }),
            ])
        );
    });

    it('every breadcrumb label has a catalog key and vice versa', () => {
        expect(Object.keys(ROUTE_LABEL_KEYS).sort()).toEqual(Object.keys(ROUTE_LABELS).sort());
        const english = flatten(enNavigation);
        for (const [segment, key] of Object.entries(ROUTE_LABEL_KEYS)) {
            expect(english[key], `${segment} → ${key}`).toBe(ROUTE_LABELS[segment]);
        }
    });

    it('the Arabic is really Arabic: nothing empty, nothing a copy of English', () => {
        const english = flatten(enNavigation);
        const arabic = flatten(arNavigation);
        expect(Object.keys(arabic).sort()).toEqual(Object.keys(english).sort());
        for (const [key, value] of Object.entries(arabic)) {
            expect(value, `${key} is empty`).not.toBe('');
            // Brand names are the only Latin strings that are shared by design.
            if (/^[\s,.…]*$/.test(value)) continue;
            expect(value, `${key} is the English string`).not.toBe(english[key]);
        }
    });

    it('every placeholder survives the translation', () => {
        const english = flatten(enNavigation);
        const arabic = flatten(arNavigation);
        for (const [key, value] of Object.entries(english)) {
            expect(placeholders(arabic[key]), key).toEqual(placeholders(value));
        }
    });

    it('every @dynamic key resolves to a real catalog entry', () => {
        const english = flatten(enNavigation);
        const arabic = flatten(arNavigation);
        const dynamic = enNavigation['@dynamic'];
        expect(dynamic.length).toBeGreaterThan(0);
        expect(arNavigation['@dynamic']).toEqual(dynamic);
        for (const key of dynamic) {
            expect(english[key], `en.${key}`).toBeTruthy();
            expect(arabic[key], `ar.${key}`).toBeTruthy();
        }
    });
});
