#!/usr/bin/env node
/**
 * T21 — the "zero new warnings" lint gate (card §2). Copied from c0c-bake;
 * the only difference is the eslint scope: this repo's flat config
 * (`eslint.config.mjs`) defines the default sweep, so the script invokes
 * `eslint` with no paths and compares against `.lint-baseline.json`:
 *
 *   errors   → must be 0 (an error never gets a baseline)
 *   warnings → must not exceed the baseline; equal is OK. The ratchet
 *              never loosens silently.
 *
 * Re-baseline deliberately: `node scripts/check-lint-baseline.mjs --write`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const BASELINE_FILE = '.lint-baseline.json';

/** @type {{ errors: number; warnings: number }} */
const baseline = JSON.parse(readFileSync(BASELINE_FILE, 'utf8'));

let raw;
try {
    raw = execFileSync('npx', ['eslint', '--format', 'json'], {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 64,
    });
} catch (error) {
    // ESLint exits non-zero on findings but still prints JSON — capture stdout.
    /** @type {string | undefined} */
    const stdout = (/** @type {{ stdout?: string }} */ (error)).stdout;
    raw = stdout ?? '';
    if (!raw.trim()) {
        console.error('ESLint produced no report — see stderr above.');
        process.exit(1);
    }
}

/** @type {Array<{ errorCount: number; warningCount: number; messages: Array<{ ruleId: string | null; severity: number }> }>} */
const reports = JSON.parse(raw);

const errors = reports.reduce((sum, r) => sum + r.errorCount, 0);
const warnings = reports.reduce((sum, r) => sum + r.warningCount, 0);
const newWarnings = warnings - baseline.warnings;

console.log(`lint totals: ${errors} errors, ${warnings} warnings (baseline: ${baseline.errors}, ${baseline.warnings})`);

if (errors > 0) {
    /** @type {Map<string, number>} */
    const byRule = new Map();
    for (const file of reports) {
        for (const m of file.messages) {
            if (m.severity === 2) byRule.set(m.ruleId ?? 'unknown', (byRule.get(m.ruleId ?? 'unknown') ?? 0) + 1);
        }
    }
    console.table([...byRule].map(([rule, count]) => ({ rule, count })));
    console.error('lint gate FAILED: errors present.');
    process.exit(1);
}

if (newWarnings > 0) {
    // Name the rules behind the new findings so the fix is obvious.
    /** @type {Map<string, number>} */
    const byRule = new Map();
    for (const file of reports) {
        for (const m of file.messages) {
            if (m.severity === 1) byRule.set(m.ruleId ?? 'unknown', (byRule.get(m.ruleId ?? 'unknown') ?? 0) + 1);
        }
    }
    console.table(
        [...byRule]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15)
            .map(([rule, count]) => ({ rule, count }))
    );
    console.error(`lint gate FAILED: ${newWarnings} new warning(s) over baseline.`);
    process.exit(1);
}

if (newWarnings < 0) {
    if (process.argv.includes('--write')) {
        writeFileSync(BASELINE_FILE, `${JSON.stringify({ errors, warnings }, null, 2)}\n`);
        console.log(`baseline tightened to ${warnings} warnings.`);
    } else {
        console.log(`lint gate PASSED and ratchet improved by ${-newWarnings} — run with --write to tighten the baseline.`);
    }
    process.exit(0);
}

console.log('lint gate PASSED (0 errors, 0 new warnings).');
