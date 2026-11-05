#!/usr/bin/env node
/**
 * T20 — first-load JS budgets (hard gate) + baseline regression gate.
 *
 * The number that matters is what the browser is actually told to download, so
 * this script serves the production build and measures the `<script src>` tags
 * in the response HTML for each route. Earlier versions parsed Turbopack's
 * client-reference manifest; that under-counted by 3–8 kB per route because it
 * only unions layout entries, not the entry-specific chunks the HTML actually
 * references.
 *
 * The server is started with `AUTH_MIDDLEWARE_MODE=presence` and a dummy
 * session cookie so the authenticated routes render their real shell instead
 * of redirecting to /login. No backend is required: the pages render their
 * loading/empty states, but the route's JS graph is identical.
 *
 *   node scripts/bundle-budget.mjs               # check budgets + baseline
 *   node scripts/bundle-budget.mjs --write       # record a new baseline
 *   node scripts/bundle-budget.mjs --budget landing=120   # override one
 *                                                          budget (used to
 *                                                          demonstrate red)
 *
 * Exit code 1 on a budget breach, a missing chunk, or a baseline regression.
 * `pnpm build` must have run first.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import zlib from 'node:zlib';

const NEXT_DIR = '.next';
const STATIC_DIR = path.join(NEXT_DIR, 'static');
const BASELINE_PATH = 'scripts/perf/baseline.json';
const BASELINE_TOLERANCE = 0.05; // 5% — dependency churn, not a licence to grow.
const KB = 1024;
const AUTH_COOKIE = 'auth_session=budget-check';
const WORKSPACE_ID = '507f1f77bcf86cd799439011';

/** Card budgets, in kB gzip. */
const ROUTES = [
  { id: 'landing', label: '/ (landing)', requestPath: '/', budget: 140 },
  { id: 'dashboard', label: '/dashboard', requestPath: '/dashboard', budget: 220 },
  {
    id: 'workspace',
    label: '/projects/[id]',
    requestPath: `/projects/${WORKSPACE_ID}`,
    budget: 260,
  },
];

const args = process.argv.slice(2);
const writeBaseline = args.includes('--write');
const budgetOverrides = new Map();
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--budget' && args[i + 1]) {
    const [id, value] = args[i + 1].split('=');
    budgetOverrides.set(id, Number(value));
    i += 1;
  }
}

if (!fs.existsSync(path.join(NEXT_DIR, 'BUILD_ID'))) {
  console.error('✗ No production build found. Run `pnpm build` first.');
  process.exit(1);
}

const freePort = () =>
  new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });

const gzipSize = (sourcePath) => {
  const file = path.join(STATIC_DIR, sourcePath.replace(/^\/_next\/static\//, ''));
  if (!fs.existsSync(file)) return null;
  return zlib.gzipSync(fs.readFileSync(file), { level: 9 }).length;
};

/** Pull the first-load scripts out of a rendered document. */
const scriptsFromHtml = (html) => {
  const sources = new Set();
  for (const match of html.matchAll(/<script([^>]*)>/g)) {
    const attributes = match[1];
    // `<script noModule>` is the legacy polyfill bundle; no modern browser runs it.
    if (/\bnoModule\b/.test(attributes)) continue;
    const src = /src="\/_next\/static\/([^"]+)"/.exec(attributes);
    if (src) sources.add(`/_next/static/${src[1]}`);
  }
  return [...sources];
};

const measureRoute = async (baseUrl, route) => {
  const response = await fetch(baseUrl + route.requestPath, {
    headers: { cookie: AUTH_COOKIE },
    signal: AbortSignal.timeout(30_000),
  });
  const html = await response.text();
  if (!response.ok) {
    throw new Error(`${route.requestPath} returned HTTP ${response.status}`);
  }

  const scripts = scriptsFromHtml(html);
  if (scripts.length === 0) {
    throw new Error(`${route.requestPath} rendered no first-load scripts`);
  }

  let total = 0;
  let missing = 0;
  for (const source of scripts) {
    const size = gzipSize(source);
    if (size === null) missing += 1;
    else total += size;
  }

  return {
    id: route.id,
    label: route.label,
    budget: budgetOverrides.get(route.id) ?? route.budget,
    kB: Number((total / KB).toFixed(1)),
    chunks: scripts.length,
    missing,
  };
};

const stopServer = (child) => {
  if (!child || child.exitCode !== null) return;
  try {
    if (process.platform === 'win32') child.kill();
    else process.kill(-child.pid, 'SIGTERM');
  } catch {
    child.kill('SIGTERM');
  }
};

const startServer = async (port) => {
  const binary = path.join('node_modules', '.bin', process.platform === 'win32' ? 'next.cmd' : 'next');
  const logs = [];
  const child = spawn(binary, ['start', '-p', String(port)], {
    env: {
      ...process.env,
      AUTH_MIDDLEWARE_MODE: 'presence',
      NEXT_TELEMETRY_DISABLED: '1',
    },
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (chunk) => logs.push(chunk.toString()));
  child.stderr.on('data', (chunk) => logs.push(chunk.toString()));

  const baseUrl = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) break;
    try {
      const response = await fetch(`${baseUrl}/`, {
        headers: { cookie: AUTH_COOKIE },
        signal: AbortSignal.timeout(2_000),
      });
      if (response.ok) return { child, baseUrl };
    } catch {
      // Not listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  stopServer(child);
  throw new Error(`next start did not become ready:\n${logs.join('').trim()}`);
};

const baseline = fs.existsSync(BASELINE_PATH)
  ? JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'))
  : {};

let server;
let results;
try {
  const port = await freePort();
  server = await startServer(port);
  results = await Promise.all(
    ROUTES.map((route) => measureRoute(server.baseUrl, route))
  );
} finally {
  stopServer(server?.child);
}

let failed = false;

console.log('\nfirst-load JS (gzip, served HTML)');
console.table(
  results.map((row) => ({
    route: row.label,
    'kB (gzip)': row.kB,
    budget: row.budget,
    chunks: row.chunks,
    'vs baseline':
      baseline.routes?.[row.id] !== undefined
        ? `${row.kB - baseline.routes[row.id] >= 0 ? '+' : ''}${(row.kB - baseline.routes[row.id]).toFixed(1)}`
        : '—',
    status: row.kB <= row.budget ? 'within budget' : 'OVER BUDGET',
  }))
);

for (const row of results) {
  if (row.missing > 0) {
    console.error(`✗ ${row.label}: ${row.missing} chunk(s) missing from disk`);
    failed = true;
  }
  if (row.kB > row.budget) {
    console.error(`✗ ${row.label}: ${row.kB} kB gzip exceeds the ${row.budget} kB budget`);
    failed = true;
  }
  const recorded = baseline.routes?.[row.id];
  if (recorded !== undefined) {
    const ceiling = recorded * (1 + BASELINE_TOLERANCE);
    if (row.kB > ceiling) {
      console.error(
        `✗ ${row.label}: ${row.kB} kB is a regression over the ${recorded} kB baseline ` +
          `(ceiling ${ceiling.toFixed(1)} kB = +${BASELINE_TOLERANCE * 100}%)`
      );
      failed = true;
    }
  }
}

if (writeBaseline && !failed) {
  const next = Object.fromEntries(results.map((row) => [row.id, row.kB]));
  fs.mkdirSync(path.dirname(BASELINE_PATH), { recursive: true });
  fs.writeFileSync(
    BASELINE_PATH,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), routes: next }, null, 2)}\n`
  );
  console.log(`\nbaseline written to ${BASELINE_PATH}`);
}

if (failed) {
  console.error('\nbundle budget FAILED');
  process.exit(1);
}
console.log('\nbundle budget PASSED');
