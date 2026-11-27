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
 *   - FAILS on a physical utility that is not on the list (a new exception
 *     slipped in) — and on an allowlist entry that no longer occurs, because
 *     stale debt must be removed rather than carried forward.
 *
 * Usage: node scripts/check-rtl.mjs [--write]
 * Exit:  0 when the code and the list agree, 1 with every violation named.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { findPhysicalUtilities } from './rtl-utilities.mjs';

const ROOT = process.cwd();
const SRC_DIR = join(ROOT, 'src');
const EXCEPTIONS_FILE = join(ROOT, 'rtl-exceptions.json');
const write = process.argv.includes('--write');

/**
 * The MATCHER lives in `scripts/rtl-utilities.mjs` — the same one the
 * rendered-output check uses (AR-021), so the gate and the test can never
 * disagree about what "a physical utility" is. The conversion table is
 * RTL-DESIGN-SYSTEM §3; `text-right` is included because text alignment is a
 * direction decision and the exception list is where numeric columns are
 * justified.
 */

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
    return findPhysicalUtilities(readFileSync(file, 'utf8'));
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

// The debt may only shrink: an allowlist entry that no longer occurs is a
// failure; `--write` is the explicit path that drops it.
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
        // `list` is a Set — the `--write` path used to call `.filter` on it
        // and threw, so the allowlist could never actually be rewritten.
        const kept = [...list].filter(
            (utility) => hits && hits.some((hit) => hit.utility === utility)
        );
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
    console.error(`\n✗ rtl gate: ${stale.length} allowlist entr(ies) no longer occur\n`);
    for (const entry of stale) console.error(`  ${entry}`);
    console.error('\nRun with --write to drop them, or restore the physical utility if it is still required.\n');
    process.exit(1);
}
