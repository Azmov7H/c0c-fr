#!/usr/bin/env node
/**
 * AR-020 — the RTL utility gate.
 *
 * The app is a bilingual product: every margin, padding and offset has to
 * work in both directions. A PHYSICAL utility (`mr-2`, `text-left`, `left-0`)
 * works in one direction only — so every one of them is either a bug waiting
 * to happen or a documented exception.
 *
 * The gate:
 *   - scans `src/**` for the physical utilities;
 *   - compares what it finds with `rtl-exceptions.json`, the allowlist of the
 *     places where a physical utility is deliberate;
 *   - FAILS on an exception that is not on the list (a new physical utility
 *     slipped in) — and on a list that GREW, because the debt may only
 *     decrease.
 *
 * Usage: node scripts/check-rtl.mjs [--write]
 * Exit:  0 when the code and the list agree, 1 with every violation named.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SRC_DIR = join(ROOT, 'src');
const EXCEPTIONS_FILE = join(ROOT, 'rtl-exceptions.json');
const write = process.argv.includes('--write');

/**
 * The physical utilities, per the conversion table (RTL-DESIGN-SYSTEM §3).
 *
 * `text-right` is included: a text alignment is a direction decision, and
 * the exception list is where the numeric columns are justified.
 */
const PHYSICAL = [
    'mr-',
    'ml-',
    'pr-',
    'pl-',
    'text-left',
    'text-right',
    'border-l',
    'border-r',
    'left-',
    'right-',
];

function sourceFiles(dir) {
    const out = [];
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
        else if (/\.(tsx|ts)$/.test(entry) && !entry.endsWith('.d.ts')) out.push(full);
    }
    return out;
}

/** The physical utilities of one file, with their line numbers. */
function findings(file) {
    const lines = readFileSync(file, 'utf8').split('\n');
    const found = [];
    lines.forEach((line, index) => {
        for (const utility of PHYSICAL) {
            // A utility inside a class list: `mr-2`, `md:ml-0`, `-right-2`.
            const escaped = utility.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
            // The token must not be followed by a letter: `border-r` is a
            // physical edge, `border-ring` is a focus ring.
            const pattern = new RegExp(
                `(?:^|[\\s"'\`])((?:[a-z-]+:)*-?${escaped}(?![a-z])[a-z0-9.\\[\\]-]*)`,
                'g'
            );
            for (const match of line.matchAll(pattern)) {
                found.push({ utility: match[1], line: index + 1 });
            }
        }
    });
    return found;
}

const exceptions = JSON.parse(readFileSync(EXCEPTIONS_FILE, 'utf8'));
const allowed = new Map(Object.entries(exceptions.files ?? {}).map(([file, list]) => [file, new Set(list)]));

const problems = [];
const found = new Map();

for (const file of sourceFiles(SRC_DIR)) {
    const relativeFile = relative(ROOT, file).replaceAll('\\', '/');
    const hits = findings(file);
    if (hits.length === 0) continue;
    found.set(relativeFile, hits);

    const allowedHere = allowed.get(relativeFile) ?? new Set();
    for (const hit of hits) {
        if (!allowedHere.has(hit.utility)) {
            problems.push(
                `${relativeFile}:${hit.line} uses the physical utility "${hit.utility}" — ` +
                    'use the logical one (me-/ms-/pe-/ps-/start-/end-/text-start)'
            );
        }
    }
}

// The debt may only shrink: an allowlist entry that no longer occurs is
// reported, and `--write` removes it.
const stale = [];
for (const [file, list] of allowed) {
    const hits = found.get(file);
    for (const utility of list) {
        if (!hits || !hits.some((hit) => hit.utility === utility)) stale.push(`${file}: ${utility}`);
    }
}

if (write) {
    const next = { ...exceptions, files: {} };
    for (const [file, list] of allowed) {
        const hits = found.get(file);
        const kept = list.filter((utility) => hits && hits.some((hit) => hit.utility === utility));
        if (kept.length) next.files[file] = kept;
    }
    next.generatedAt = new Date().toISOString();
    writeFileSync(EXCEPTIONS_FILE, `${JSON.stringify(next, null, 2)}\n`);
    console.log(`✓ rtl allowlist rewritten (${Object.keys(next.files).length} file(s) with exceptions)`);
    process.exit(0);
}

if (problems.length > 0) {
    console.error(`\n✗ rtl gate: ${problems.length} physical utilit(ies) without an exception\n`);
    for (const problem of problems) console.error(`  ${problem}`);
    console.error('\nUse the logical utility, or list the place in rtl-exceptions.json.\n');
    process.exit(1);
}

const total = [...found.values()].reduce((sum, hits) => sum + hits.length, 0);
console.log(
    `✓ rtl gate: ${total} physical utilit(ies), all on the allowlist (${allowed.size} file(s))`
);
if (stale.length > 0) {
    console.log(`  ${stale.length} allowlist entr(ies) no longer occur — run with --write to drop them`);
    for (const entry of stale) console.log(`  · ${entry}`);
}
