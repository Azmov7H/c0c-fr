#!/usr/bin/env node
/**
 * T21 — dependency-audit gate (card §secrets/audit: "blocking, documented
 * exceptions — not silent waivers").
 *
 * Runs `pnpm audit --json` and fails when any advisory at/above `--level`
 * is present unless it is explicitly recorded in `.audit-exceptions.json`
 * with a reason, an owner and a review date. Record-only exceptions whose
 * advisory has been fixed upstream fail the gate too, so the exception file
 * cannot outlive the vulnerability it waives.
 *
 *     node scripts/audit-gate.mjs [--level high] [--scope full|prod]
 *
 * pnpm audit exits non-zero whenever the JSON body is produced — the exit
 * status of the child is irrelevant here, only the parsed advisories are.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const arg = (name, fallback) => {
    const i = args.indexOf(name);
    return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};
const LEVEL = arg('--level', 'high');
const SCOPE = arg('--scope', 'full'); // full tree, or --scope prod for dependencies only
const RANK = { low: 0, moderate: 1, high: 2, critical: 3 };

if (!(LEVEL in RANK)) {
    console.error(`audit gate: unknown --level '${LEVEL}' (low|moderate|high|critical)`);
    process.exit(1);
}
if (!['full', 'prod'].includes(SCOPE)) {
    console.error(`audit gate: unknown --scope '${SCOPE}' (full|prod)`);
    process.exit(1);
}

const pnpmArgs = ['audit', '--json'];
if (SCOPE === 'prod') pnpmArgs.push('--prod');
let raw;
try {
    raw = execFileSync('pnpm', pnpmArgs, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
} catch (err) {
    // pnpm exits 1 when advisories exist — stdout still carries the JSON.
    raw = err.stdout ?? '';
}
if (!raw.trim()) {
    console.error('audit gate: `pnpm audit --json` produced no output');
    process.exit(1);
}
const data = JSON.parse(raw);
const advisories = Object.values(data.advisories ?? {});

const exceptionsPath = join(ROOT, '.audit-exceptions.json');
const exceptions = existsSync(exceptionsPath)
    ? JSON.parse(readFileSync(exceptionsPath, 'utf8')).exceptions ?? []
    : [];
const exceptedIds = new Set(exceptions.map((e) => e.advisory));

const failing = [];
const excepted = [];
for (const a of advisories) {
    if (RANK[a.severity] >= RANK[LEVEL]) {
        if (exceptedIds.has(a.id)) excepted.push(`  ${a.severity} ${a.module_name} (#${a.id}) — waived, see .audit-exceptions.json`);
        else failing.push(`  ${a.severity} ${a.module_name} (#${a.id}) ${a.url ?? ''}`);
    }
}

// Staleness: an exception for an advisory that no longer exists means the
// ecosystem moved on — prune the file instead of quietly carrying the waiver.
// Enforced only in `full` scope: with `--scope prod`, dev-tree entries are an
// informational ledger (pnpm never reports them in a prod run), so staleness
// cannot be observed there.
const presentIds = new Set(advisories.map((a) => a.id));
if (SCOPE === 'full') {
    for (const e of exceptions) {
        if (!presentIds.has(e.advisory)) {
            failing.push(`  stale exception #${e.advisory} (${e.module ?? 'unknown'}) — advisory is fixed upstream, remove from .audit-exceptions.json`);
        }
    }
}

console.log(`audit gate: ${advisories.length} advisories reported by pnpm audit (${SCOPE}); gate level ≥ ${LEVEL}`);
if (excepted.length) {
    console.log('waived (documented):');
    for (const line of excepted) console.log(line);
}

if (failing.length) {
    console.error('\nblockers:');
    for (const line of failing) console.error(line);
    console.error(
        `audit gate FAILED — fix the dependency (pnpm overrides or update), or record an exception in \`.audit-exceptions.json\` with reason, owner and review date.`
    );
    process.exit(1);
}
console.log('audit gate PASSED.');
