/**
 * T18 — Playwright global setup.
 *
 * Boots the *whole real stack* into a disposable runtime, per the task's rule:
 * "run against a real backend with an in-memory Mongo — never mocks for E2E":
 *
 *   1. a throwaway `mongod` on its own port with a temp `dbpath` (the system
 *      binary — this uses no node shim, so no new dependency);
 *   2. the REAL AI provider client inside the REAL backend, pointed at a local
 *      OpenAI-compatible stub via `ALIBABA_BASE_URL`. The SDK runs unchanged;
 *      the network destination is the only replaced leg. No live API key is
 *      ever dialed.
 *   3. `c0c-bake`'s compiled code (`node dist/server.js`) with E2E-only env:
 *      a burst-grade API rate limit (journeys exceed it deliberately; auth
 *      limiting stays), 20-minute access tokens (fixture lifetime), and an
 *      E2E-only `STRIPE_WEBHOOK_SECRET` so the webhook route is exercised at
 *      the delivery boundary — the card forbids depending on a hosted
 *      checkout round trip, which is the ONLY thing not simulated.
 *   4. the REAL frontend (`next start` on the production build) pointing at 3.
 *
 * `next build` must have run before this file executes (the test:e2e script
 * chains them); without a build we fail immediately rather than letting
 * workers time out against nothing.
 *
 * It then registers fixture users through the frontend BFF — the exact
 * register route the signup form uses — so every journey starts from a real
 * `storageState` cookie jar instead of a forged session token. Fixture auth
 * happens once per persona, in its own `X-Forwarded-For` bucket (the backend
 * is told to trust one proxy hop in the e2e env), so nothing in the suite can
 * trip the auth rate limiter by accident.
 *
 * Teardown is honoured by Playwright: kill children, close the fake AI server,
 * stop mongod, wipe temp state. `.auth/` storage states remain for post-mortem
 * inspection but are git-ignored (they carry live session tokens).
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';

import {
    AI_FAKE_URL,
    AI_PORT,
    API_PORT,
    API_URL,
    FE_PORT,
    FE_URL,
    JWT_REFRESH_SECRET,
    JWT_SECRET,
    STRIPE_WEBHOOK_SECRET,
    completeOnboarding,
    createProject,
    registerPersona,
    startFakeAiServer,
    storageStateFor,
    type IndexedPersona,
} from './harness';

const REPO_ROOT = process.cwd(); // playwright runs from the repo root
const BAKE_ROOT = path.resolve(REPO_ROOT, '..', 'c0c-bake');
const AUTH_DIR = path.join(REPO_ROOT, 'tests', 'e2e', '.auth');

const MONGO_PORT = 19_532;

const BACKEND_ENV: Record<string, string> = {
    NODE_ENV: 'development',
    PORT: String(API_PORT),
    MONGODB_URI: `mongodb://127.0.0.1:${MONGO_PORT}/c0c_t18_e2e`,
    JWT_SECRET,
    JWT_REFRESH_SECRET,
    JWT_EXPIRE: '20m',
    JWT_REFRESH_EXPIRE: '7d',
    APP_URL: FE_URL,
    RATE_LIMIT_WINDOW_MS: '900000',
    RATE_LIMIT_MAX: '100000', // journeys burst on purpose (quota, not limiter)
    // Auth endpoints are otherwise capped at 10/15 min PER IP; every journey
    // mount costs ws-token + me calls through the BFF, which the suite's
    // multi-journey run exceeds long before anyone misbehaves. The production
    // default remains 10 — this only widens the E2E process.
    // Auth endpoints are otherwise capped at 10/15 min PER IP; every journey
    // mount costs ws-token + me calls through the BFF, which the suite's
    // multi-journey run exceeds long before anyone misbehaves. The production
    // default remains 10 — this only widens the E2E process.
    RATE_LIMIT_AUTH_MAX: '100000',
    // Same reasoning for the billable-AI boundary: journey 4 exhausts the
    // starter quota (50) with real generate calls inside a minute. Production
    // default stays 30/min; this widening lives in the E2E process only.
    RATE_LIMIT_AI_MAX: '100000',
    // The browser's rewrite-proxied calls carry `Origin: <FE_URL>`. Without
    // this, dispatch.env CORS_ORIGIN defaults to http://localhost:3000 and the
    // backend 403s every in-page mutation — the wizard save, the Generate
    // click and the rename all fail with CORS_ORIGIN_DENIED instead of
    // exercising their real backend behaviour.
    CORS_ORIGIN: FE_URL,
    TRUST_PROXY_HOPS: '1', // fixtures register in their own XFF bucket
    ALIBABA_BASE_URL: AI_FAKE_URL,
    STRIPE_WEBHOOK_SECRET,
};

/**
 * Env vars that must NOT leak from the developer's real `c0c-bake/.env` into
 * the throwaway stack. It is loaded by `dotenv.config()` for everything the
 * spawn env does not set — notably the Upstash KV pair, which would make the
 * rate-limit store SHARED with the developer's live dev backend (and persist
 * across E2E runs → non-deterministic 429s and pollution of their counters).
 * Unset ⇒ in-memory store, the intended production fallback for this
 * short-lived isolated process.
 */
const ENV_DENYLIST = [
    'KV_REST_API_URL',
    'KV_REST_API_TOKEN',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
];

// ─── Small utilities ─────────────────────────────────────────────────────────

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const logPrefix = (): string => `[t18-e2e ${new Date().toISOString().slice(11, 19)}]`;

function echo(child: ChildProcess, label: string): void {
    child.stdout?.on('data', (chunk: Buffer) => {
        process.stderr.write(`${logPrefix()} ${label}: ${chunk.toString()}`);
    });
    child.stderr?.on('data', (chunk: Buffer) => {
        process.stderr.write(`${logPrefix()} ${label} ! ${chunk.toString()}`);
    });
}

async function waitUntilReady(
    label: string,
    url: string,
    child: ChildProcess,
    timeoutMs: number
): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
        if (child.exitCode !== null) {
            throw new Error(`${label} failed to launch (exited with ${child.exitCode})`);
        }
        try {
            const response = await fetch(url, { signal: AbortSignal.timeout(2_000) });
            if (response.ok) return;
        } catch {
            // still warming up
        }
        if (Date.now() > deadline) {
            throw new Error(`${label} never became ready at ${url} within ${timeoutMs} ms`);
        }
        await sleep(400);
    }
}

async function portIsFree(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const probe = net.createServer();
        probe.once('error', () => resolve(false));
        probe.once('listening', () => probe.close(() => resolve(true)));
        probe.listen(port, '127.0.0.1');
    });
}

async function waitForTcp(port: number, child: ChildProcess): Promise<void> {
    const deadline = Date.now() + 30_000;
    for (;;) {
        if (child.exitCode !== null) {
            throw new Error(`mongod exited while warming up (code ${child.exitCode})`);
        }
        const reachable = await new Promise<boolean>((resolve) => {
            const socket = net.connect(port, '127.0.0.1');
            socket.once('connect', () => {
                socket.end();
                resolve(true);
            });
            socket.once('error', () => resolve(false));
        });
        if (reachable) return;
        if (Date.now() > deadline) throw new Error('mongod never started listening');
        await sleep(300);
    }
}

void waitForTcp; // see startMongo below: TCP probe kept for diagnostics parity

// ─── mongod + fake AI ────────────────────────────────────────────────────────

function startMongo(dbPath: string): ChildProcess {
    return spawn(
        '/usr/bin/mongod',
        ['--port', String(MONGO_PORT), '--dbpath', dbPath, '--bind_ip', '127.0.0.1'],
        { stdio: ['ignore', 'pipe', 'pipe'] }
    );
}

// ─── Fixture users ───────────────────────────────────────────────────────────

/** Persona + its prepared project id. The storageState file nests next to it. */
export interface StagedFixture {
    persona: IndexedPersona;
    projectId: string;
    storageStatePath: string;
}

function registerFixture(spec: {
    key: string;
    firstName: string;
    lastName: string;
    xForwardedFor: string;
}): Promise<IndexedPersona> {
    // The dot is the filesystem nuance; the email-local part must stay unique
    // per persona, so `journey2.owner` registers as `journey2-owner@…`.
    return registerPersona({
        key: spec.key.replace('.', '-'),
        firstName: spec.firstName,
        lastName: spec.lastName,
        forwardedFor: spec.xForwardedFor,
    });
}

const FIXTURE_SPECS = [
    { key: 'journey2.owner', firstName: 'June', lastName: 'Owner', xForwardedFor: '203.0.113.11' },
    { key: 'journey3.owner', firstName: 'Joa', lastName: 'Owner', xForwardedFor: '203.0.113.12' },
    { key: 'journey4.owner', firstName: 'Junip', lastName: 'Quota', xForwardedFor: '203.0.113.13' },
    { key: 'journey5.owner', firstName: 'Jora', lastName: 'Ttl', xForwardedFor: '203.0.113.14' },
] as const;

async function buildFixtures(): Promise<Record<string, StagedFixture>> {
    const staged: Record<string, StagedFixture> = {};
    for (const spec of FIXTURE_SPECS) {
        const persona = await registerFixture(spec);
        await completeOnboarding(persona);
        const project = await createProject(persona, `${spec.key} fixture project`);

        const storageStatePath = path.join(AUTH_DIR, `${spec.key}.json`);
        writeFileSync(storageStatePath, JSON.stringify(storageStateFor(persona), null, 2));

        staged[spec.key] = { persona, projectId: project._id, storageStatePath };
    }
    return staged;
}
// ─── The orchestrator ────────────────────────────────────────────────────────

export default async function globalSetup(): Promise<() => Promise<void>> {
    for (const port of [FE_PORT, API_PORT, AI_PORT, MONGO_PORT]) {
        if (!(await portIsFree(port))) {
            throw new Error(
                `port ${port} is occupied. The e2e stack ports are fixed (tests/e2e/harness.ts); ` +
                    'stop whatever holds them, or run `node tests/e2e/port-scan.mjs` to find it.'
            );
        }
    }

    rmSync(AUTH_DIR, { recursive: true, force: true });
    mkdirSync(AUTH_DIR, { recursive: true });
    mkdirSync(path.join(REPO_ROOT, 'tests', 'e2e', '.run'), { recursive: true });
    // Aborted previous runs can leave temp stack dirs (a failure between mkdtemp
    // and teardown skips the cleanup); reclaim them.
    for (const entry of readdirSync(path.join(REPO_ROOT, 'tests', 'e2e', '.run'))) {
        if (entry.startsWith('stack-')) {
            rmSync(path.join(REPO_ROOT, 'tests', 'e2e', '.run', entry), { recursive: true, force: true });
        }
    }

    try {
        readFileSync(path.join(REPO_ROOT, '.next', 'BUILD_ID'));
    } catch {
        throw new Error(
            'no frontend production build found. `test:e2e` chains `next build` before the runner; ' +
                'if invoking `playwright test` directly, run `npm run build` one step earlier.'
        );
    }

    const tmpDir = mkdtempSync(path.join(REPO_ROOT, 'tests', 'e2e', '.run', 'stack-'));
    const aiServer = await startFakeAiServer();
    // mongod refuses to start with `--dbpath` pointing at a missing directory
    // (exit 100 NonExistentPath); the parent exists via mkdtemp, the leaf does not.
    const dbPath = path.join(tmpDir, 'mongo-data');
    mkdirSync(dbPath, { recursive: true });
    const mongo = startMongo(dbPath);
    echo(mongo, 'mongod');
    await waitForTcp(MONGO_PORT, mongo);

    const backend = spawn('node', ['dist/server.js'], {
        cwd: BAKE_ROOT,
        env: {
            ...process.env,
            ...BACKEND_ENV,
            ...Object.fromEntries(ENV_DENYLIST.map((key) => [key, ''])),
        },
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    echo(backend, 'backend');
    await waitUntilReady('backend', `${API_URL}/api/v1/health/ready`, backend, 60_000);

    const frontend = spawn(
        'node',
        ['node_modules/next/dist/bin/next', 'start', '-p', String(FE_PORT)],
        {
            cwd: REPO_ROOT,
            env: { ...process.env, API_URL, JWT_SECRET, NODE_ENV: 'production' },
            stdio: ['ignore', 'pipe', 'pipe'],
        }
    );
    echo(frontend, 'frontend');
    await waitUntilReady('frontend', `${FE_URL}/login`, frontend, 90_000);

    const staged = await buildFixtures();
    writeFileSync(
        path.join(REPO_ROOT, 'tests', 'e2e', 'fixtures.json'),
        JSON.stringify(
            {
                personas: Object.fromEntries(
                    Object.entries(staged).map(([key, fixture]) => [
                        key,
                        {
                            persona: {
                                id: fixture.persona.id,
                                email: fixture.persona.email,
                            },
                            projectId: fixture.projectId,
                        },
                    ])
                ),
            },
            null,
            2
        )
    );
    console.log(
        `${logPrefix()} stack ready: ${FE_URL} → ${API_URL} (mongod :${MONGO_PORT}, fake AI :${AI_PORT})`
    );

    let torn = false;
    return async function teardownE2e(): Promise<void> {
        if (torn) return;
        torn = true;
        for (const child of [frontend, backend, mongo]) child.kill('SIGTERM');

        for (const child of [frontend, backend, mongo]) {
            await new Promise<void>((resolve) => {
                child.once('exit', () => resolve());
                setTimeout(() => {
                    child.kill('SIGKILL');
                    resolve();
                }, 3_000);
            });
        }

        aiServer.close();
        rmSync(tmpDir, { recursive: true, force: true });
        console.log(`${logPrefix()} stack torn down`);
    };
}
