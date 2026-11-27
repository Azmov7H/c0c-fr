#!/usr/bin/env node
/**
 * Keep browser source maps, shrink their first-load cost.
 *
 * Turbopack emits hashed 20-character source-map filenames. Every served JS
 * chunk repeats one in a `sourceMappingURL` comment, and those comments add
 * ~250 bytes gzip across the workspace route — enough to turn a 260 kB budget
 * pass into a Vercel failure. This post-build step renames each map to a short
 * sequence (`0.js.map`, `1.js.map`, …) inside its own directory and rewrites
 * the matching comment. Maps remain browser-readable; only the URL is shorter.
 *
 * It runs after `next build` and before `bundle-budget.mjs`, so the gate measures
 * exactly what Vercel will serve. Re-running it on an already-shortened build is
 * a no-op.
 */
import fs from 'node:fs';
import path from 'node:path';

const STATIC_DIR = path.join('.next', 'static');

if (!fs.existsSync(STATIC_DIR)) {
    console.error('✗ No production build found. Run `next build` first.');
    process.exit(1);
}

function walk(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        return entry.isDirectory() ? walk(full) : entry.isFile() && full.endsWith('.js') ? [full] : [];
    });
}

let counter = 0;
let rewritten = 0;

for (const file of walk(STATIC_DIR)) {
    const source = fs.readFileSync(file, 'utf8');
    const dir = path.dirname(file);
    const used = new Set();

    const output = source.replace(
        /\/\/# sourceMappingURL=([^\s]+\.js\.map)[ \t]*$/gm,
        (_match, mapName) => {
            const from = path.join(dir, mapName);
            if (!fs.existsSync(from)) return `//# sourceMappingURL=${mapName}`;

            let shortName;
            do {
                shortName = `${(counter++).toString(36)}.js.map`;
            } while (used.has(shortName) || (fs.existsSync(path.join(dir, shortName)) && path.join(dir, shortName) !== from));
            used.add(shortName);

            const to = path.join(dir, shortName);
            if (to !== from) fs.renameSync(from, to);
            rewritten += 1;
            return `//# sourceMappingURL=${shortName}`;
        }
    );

    if (output !== source) fs.writeFileSync(file, output);
}

console.log(`shortened ${rewritten} source-map URL(s)`);
