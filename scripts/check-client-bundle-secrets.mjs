#!/usr/bin/env node
/**
 * Asserts no server-side secret leaks into the client bundle (T09).
 *
 * Next inlines `process.env.*` references at build time, so the honest check
 * is the VALUE, not the variable name: if the value of JWT_SECRET (or a
 * non-localhost API_URL) appears anywhere under .next/static, it is in a
 * browser-downloadable file.
 *
 * Wire into CI after `next build` (T21); runnable now as:
 *   npm run check:client-secrets
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const STATIC_DIR = '.next/static';

function* walk(dir) {
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) yield* walk(full);
        else yield full;
    }
}

function readEnvValue(name) {
    const fromProcess = process.env[name];
    if (fromProcess) return fromProcess;
    for (const file of ['.env.local', '.env.production', '.env']) {
        try {
            for (const line of readFileSync(file, 'utf8').split('\n')) {
                const match = line.match(new RegExp(`^\\s*${name}\\s*=\\s*(.+)\\s*$`));
                if (match) return match[1].replace(/^["']|["']$/g, '');
            }
        } catch {
            // file absent — keep looking
        }
    }
    return null;
}

try {
    statSync(STATIC_DIR);
} catch {
    console.error(`✗ ${STATIC_DIR} not found — run \`next build\` first.`);
    process.exit(1);
}

const checks = [];
const jwtSecret = readEnvValue('JWT_SECRET');
if (jwtSecret) checks.push(['JWT_SECRET', jwtSecret]);

const apiUrl = readEnvValue('API_URL');
if (apiUrl && !/^https?:\/\/localhost(:\d+)?$/.test(apiUrl)) {
    checks.push(['API_URL (non-localhost)', apiUrl]);
}

if (checks.length === 0) {
    console.log('✓ nothing secret is configured that could leak (JWT_SECRET/API_URL unset or local).');
    process.exit(0);
}

let failed = false;
for (const file of walk(STATIC_DIR)) {
    const content = readFileSync(file, 'utf8');
    for (const [label, value] of checks) {
        if (content.includes(value)) {
            console.error(`✗ ${label} value found in client bundle file: ${file}`);
            failed = true;
        }
    }
}

if (failed) {
    console.error('\nSecrets must never reach .next/static. Find the client-side import and move it server-side.');
    process.exit(1);
}
console.log(`✓ no secret values in ${STATIC_DIR} (checked: ${checks.map(([l]) => l).join(', ')})`);
