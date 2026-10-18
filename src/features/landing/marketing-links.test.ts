import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { PUBLIC_ROUTES, SITE_URL } from '@/lib/public-routes';

/**
 * T11 AC2: zero dead internal links in the marketing tree, verified against
 * the real route table rather than by eye.
 *
 * This walks every file that can render a link on the marketing surface
 * (the route group, the landing components, the marketing header/footer),
 * extracts every static href, and asserts:
 *   - plain paths resolve to a real `page.tsx`
 *   - fragment links (`#assets`, `/#pricing`) resolve to a real `id` on a
 *     page in the marketing tree
 *   - external/social links are either https URLs or absent
 *
 * The old page failed this test on 11 counts; that is exactly why it exists.
 */

const ROOT = path.resolve(__dirname, '..', '..');
const APP_DIR = path.join(ROOT, 'app');
const SCAN_ROOTS = [
    path.join(APP_DIR, '(marketing)'),
    path.join(ROOT, 'features', 'landing'),
    path.join(ROOT, 'components', 'layout', 'marketing-header.tsx'),
    path.join(ROOT, 'components', 'layout', 'marketing-footer.tsx'),
];

function walk(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];
    const stat = fs.statSync(dir);
    if (stat.isFile()) return [dir];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        return entry.isDirectory() ? walk(full) : [full];
    });
}

const LINK_FILES = SCAN_ROOTS.flatMap(walk).filter((file) => file.endsWith('.tsx'));

function extractHrefs(): string[] {
    const hrefs: string[] = [];
    for (const file of LINK_FILES) {
        const content = fs.readFileSync(file, 'utf8');
        for (const match of content.matchAll(
            /href=(?:"([^"]*)"|\{'([^']*)'\}|\{`([^`]*)`\})/g
        )) {
            const href = match[1] ?? match[2] ?? match[3];
            if (href) hrefs.push(href);
        }
    }
    return hrefs;
}

function extractIds(): Set<string> {
    const ids = new Set<string>();
    for (const file of LINK_FILES) {
        const content = fs.readFileSync(file, 'utf8');
        for (const match of content.matchAll(/\bid="([^"]+)"/g)) {
            ids.add(match[1]);
        }
    }
    return ids;
}

function pageExists(urlPath: string): boolean {
    const parts = urlPath.split('/').filter(Boolean);
    const candidates = [
        path.join(APP_DIR, '(marketing)', ...parts, 'page.tsx'),
        path.join(APP_DIR, '(auth)', ...parts, 'page.tsx'),
        path.join(APP_DIR, '(dashboard)', ...parts, 'page.tsx'),
        path.join(APP_DIR, ...parts, 'page.tsx'),
    ];
    return candidates.some((candidate) => fs.existsSync(candidate));
}

const MARKETING_IDS = extractIds();

describe('marketing links (T11 AC2: zero dead internal links)', () => {
    it('scans the marketing surface', () => {
        expect(LINK_FILES.length).toBeGreaterThan(5);
    });

    it('every internal path resolves to a real page', () => {
        const dead: string[] = [];
        for (const href of extractHrefs()) {
            if (/^(https?:|mailto:|tel:)/.test(href)) continue;
            const [urlPath] = href.split('#');
            if (urlPath === '' || urlPath === '/') continue;
            if (!pageExists(urlPath)) dead.push(href);
        }
        expect(
            dead,
            `dead internal links: ${dead.join(', ')} — every href must resolve`
        ).toEqual([]);
    });

    it('every fragment link resolves to a real section id', () => {
        const broken: string[] = [];
        for (const href of extractHrefs()) {
            const hashIndex = href.indexOf('#');
            if (hashIndex === -1) continue;
            const fragment = href.slice(hashIndex + 1);
            if (!fragment) continue;
            const targetPath = href.slice(0, hashIndex);
            // Fragments on pages outside the marketing tree are out of scope;
            // the scan covers all of them today.
            if (targetPath && targetPath !== '/' && !pageExists(targetPath)) continue;
            if (!MARKETING_IDS.has(fragment)) broken.push(href);
        }
        expect(broken, `fragments without a matching id: ${broken.join(', ')}`).toEqual([]);
    });

    it('the CTAs the brief names resolve: /signup exists, /demo and /templates do not', () => {
        expect(pageExists('/signup')).toBe(true);
        expect(pageExists('/demo')).toBe(false);
        expect(pageExists('/templates')).toBe(false);
    });

    it('fabricated social links are gone', () => {
        const socials = extractHrefs().filter((href) =>
            /twitter\.com|github\.com|linkedin\.com/.test(href)
        );
        expect(socials, `social links without real profiles: ${socials.join(', ')}`).toEqual([]);
    });
});

describe('public route table (robots / sitemap)', () => {
    it('every advertised public route has a real page', () => {
        const dead = PUBLIC_ROUTES.map((route) => route.path).filter(
            (routePath) => routePath !== '/' && !pageExists(routePath)
        );
        expect(dead, `sitemap announces routes without a page: ${dead.join(', ')}`).toEqual([]);
    });

    it('does not advertise private or auth routes', () => {
        const leaked = PUBLIC_ROUTES.filter((route) =>
            /^\/(login|signup|register|dashboard|settings|projects)/.test(route.path)
        );
        expect(leaked.map((route) => route.path)).toEqual([]);
    });

    it('robots.txt disallows auth-flow pages but still does not enumerate private prefixes', async () => {
        const { default: robots } = await import('@/app/robots');
        const result = robots();
        const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
        const disallow = rules.flatMap((rule) => rule?.disallow ?? []);
        // T12: the auth pages are linked from public pages, so they are listed
        // explicitly. Private prefixes (/dashboard, /settings, …) stay out —
        // see robots.ts for the rationale.
        expect(disallow).toEqual([
            '/login',
            '/signup',
            '/register',
            '/forgot-password',
            '/reset-password',
            '/verify-email',
        ]);
        expect(result.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
    });

    it('sitemap URLs come from the route table, nothing else', async () => {
        const { default: sitemap } = await import('@/app/sitemap');
        const urls = sitemap().map((entry) => entry.url);
        const expected = PUBLIC_ROUTES.map((route) =>
            route.path === '/' ? SITE_URL : `${SITE_URL}${route.path}`
        );
        expect(urls).toEqual(expected);
    });
});
