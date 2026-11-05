#!/usr/bin/env node
/**
 * T21 — route-table link checker (card §2 `links`).
 *
 * T10/T11 fixed the known dead links; this keeps the next `/signup` from
 * shipping. The checker does NOT keep a hand-written route list (that would be
 * the same stale source of truth it is meant to catch). It reads the REAL
 * Next.js route table straight from the filesystem:
 *
 *   src/app/**\/page.tsx   → page routes
 *   src/app/**\/route.ts   → route handlers (the /api/auth BFF surface)
 *
 * Route groups — `(auth)`, `(dashboard)`, `(marketing)` — are transparent in
 * URLs and are flattened. Dynamic segments match one path segment; catch-all
 * segments match the rest.
 *
 * Checked:
 *   1. every literal `href` in src/**\/*.tsx (static, JSX-expression and
 *      template-literal forms — template holes become one-segment wildcards);
 *   2. markdown links in README.md (`[text](/path)`) and first-column
 *      backticked route rows in markdown tables (`| `/path` | ... |`).
 *
 * Deliberately out of scope: `/api/v1/**`. That prefix is a Next rewrite to
 * the external backend (next.config.ts), not a route in this app — the
 * backend owns that contract and validates it in its own repo.
 *
 * Usage: node scripts/check-links.mjs [--verbose]
 * Exit: 0 all links resolve, 1 one or more dead links (each named file:line).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const VERBOSE = process.argv.includes('--verbose');

/* ------------------------------------------------------------------ routes */

/** @returns {string[]} absolute file paths under `dir` ending in `ext` */
function walk(dir, ext) {
	const out = [];
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		const stat = statSync(full);
		if (stat.isDirectory()) out.push(...walk(full, ext));
		else if (entry.endsWith(ext)) out.push(full);
	}
	return out;
}

/**
 * Turns `src/app/(dashboard)/projects/[id]/page.tsx` into the route pattern
 * `/projects/[id]`. Groups are flattened; the file name maps to the segment
 * before it (root page → `/`).
 */
function routePattern(file) {
	const rel = relative(join(ROOT, 'src/app'), file).replaceAll('\\', '/');
	const segments = rel
		.replace(/\/(page\.tsx|route\.ts)$/, '')
		.split('/')
		.filter((segment) => segment && !/^\(.+\)$/.test(segment));
	return `/${segments.join('/')}`;
}

/** Route patterns → matchers. Static wins over dynamic for equal depth. */
function compileRoute(pattern) {
	const segments = pattern.split('/').filter(Boolean);
	const parts = segments.map((segment) => {
		if (/^\[\[\.\.\..+\]\]$/.test(segment)) return '(?:/.*)?'; // optional catch-all
		if (/^\[\.\.\..+\]$/.test(segment)) return '/.+'; // catch-all
		if (/^\[.+\]$/.test(segment)) return '/[^/]+'; // dynamic
		return `/${segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`;
	});
	return new RegExp(`^${parts.join('') || '/'}$`);
}

const pageFiles = walk(join(ROOT, 'src/app'), 'page.tsx');
const routeFiles = walk(join(ROOT, 'src/app'), 'route.ts');
const patterns = [...new Set([...pageFiles, ...routeFiles].map(routePattern))];
const routes = patterns.map((pattern) => ({ pattern, match: compileRoute(pattern) }));

/**
 * Does `path` resolve against the real route table? Query strings and hash
 * fragments are not part of routing and are stripped before matching.
 */
function resolves(rawPath) {
	const path = rawPath.split(/[?#]/)[0] || '/';
	if (path === '/') return routes.some((route) => route.pattern === '/');
	if (path.startsWith('/api/v1/')) return true; // proxied rewrite, backend-owned
	return routes.some((route) => route.match.test(path));
}

/* ------------------------------------------------------------------ sources */

/** @type {{ file: string, line: number, href: string }[]} */
const links = [];

function add(file, line, href) {
	// External schemes and pure fragments are not app routes.
	if (/^(https?:|mailto:|tel:|data:|javascript:)/.test(href)) return;
	if (href.startsWith('#')) return;
	links.push({ file: relative(ROOT, file), line, href });
}

/** Every `href="..."` / `href={'...'}` / `href={`...`}` in TSX sources. */
function scanTsx(file) {
	const source = readFileSync(file, 'utf8');
	const lines = source.split('\n');
	const hrefPattern = /href=(?:"([^"]+)"|'([^']+)'|\{\s*['"`]([^'"`]+)['"`]\s*\})/g;

	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
		let match;
		while ((match = hrefPattern.exec(line)) !== null) {
			// Template holes (`/projects/${id}`) become a one-segment wildcard:
			// we verify the static prefix, not the runtime id.
			const href = (match[1] ?? match[2] ?? match[3]).replace(/\$\{[^}]+\}/g, 'x');
			add(file, index + 1, href);
		}
	}
}

for (const file of walk(join(ROOT, 'src'), '.tsx')) scanTsx(file);

/** README markdown: inline links + route-table first columns. */
function scanReadme(file) {
	const source = readFileSync(file, 'utf8');
	const lines = source.split('\n');
	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
		// [label](/internal/path) — skip images (![..]) and absolute URLs.
		for (const match of line.matchAll(/(?<!!)\[[^\]]*\]\((\/[^)\s]+)\)/g)) {
			add(file, index + 1, match[1]);
		}
		// | `/route` | description | — the route table.
		const row = /^\|\s*`(\/[^`]*)`\s*\|/.exec(line);
		if (row) add(file, index + 1, row[1]);
	}
}

for (const readme of ['README.md', 'tests/README.md']) {
	try {
		statSync(join(ROOT, readme));
		scanReadme(join(ROOT, readme));
	} catch {
		/* optional */
	}
}

/* ------------------------------------------------------------------ verdict */

const dead = links.filter((link) => !resolves(link.href));

if (VERBOSE) {
	console.log(`route table: ${patterns.length} patterns`);
	for (const pattern of patterns.sort()) console.log(`  ${pattern}`);
	console.log(`checked ${links.length} internal link(s)`);
}

if (dead.length > 0) {
	console.error(`\ncheck-links: ${dead.length} dead internal link(s) — no matching route in src/app:\n`);
	for (const link of dead) {
		console.error(`  ${link.file}:${link.line}  ${link.href}`);
	}
	console.error('\nRoutes come from src/app/**/page.tsx and route.ts; groups are flattened,');
	console.error('dynamic segments match one segment. Fix the link or add the route.\n');
	process.exit(1);
}

console.log(`check-links: OK — ${links.length} internal link(s) resolve against ${patterns.length} route pattern(s).`);
