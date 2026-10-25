/**
 * T18 — shared harness for the Playwright E2E journeys.
 *
 * Everything a journey needs that is not a browser step lives here, so the
 * specs stay readable and the infrastructure decisions are made in one place:
 *
 *   - `E2E_PORTS` and the rest of the runtime knobs for the spawned stack;
 *   - `registerPersona` — proven against the REAL BFF register route, so the
 *     cookie jar in the storageState is exactly what production sets
 *     (`__Host-` session + promoted refresh cookie, T02/T12);
 *   - `completeOnboarding` / `createProject` / `exhaustQuota` — fixture setup
 *     through the backend API (these are harness steps, not the journeys
 *     themselves: the journeys exercise the UI);
 *   - `mintExpiredAccessToken` — a legitimately signed token with `exp` in the
 *     past, used by journey 5 to force expiry deterministically instead of
 *     sleeping out a TTL wall-clock;
 *   - `signedStripeEvent` — a Stripe signature header in `t=…,v1=…` form,
 *     exactly what `stripe.webhooks.constructEvent` verifies, so the backend's
 *     real HMAC check runs. The webhook delivery itself is simulated at the
 *     delivery boundary, because a hosted-checkout round trip (and therefore a
 *     real webhook arrival) needs the Stripe CLI and network egress — see the
 *     journey's header comment and STATUS for the documented deviation;
 *   - `startFakeAiServer` — an OpenAI-compatible `POST …/chat/completions`
 *     stub on 127.0.0.1, pointed at by `ALIBABA_BASE_URL`.

 * `global-setup.ts` is the only file allowed to *boot* the stack; everything
 * in this module is pure helper code (importing it has no side effects).
 */

import http, { type RequestListener, type Server } from 'node:http';
import crypto from 'node:crypto';

// ─── Runtime constants ───────────────────────────────────────────────────────

/**
 * Fixed ports. The stack is throwaway and per-run; a second concurrent run of
 * the E2E suite on this machine is not supported (document in tests/README.md).
 * `19xxx` and `52xxx` ranges avoid the dev servers (:3000 / :5001) and every
 * port used by other evidence stacks in this repo history (:5002/:3100…).
 */
export const FE_PORT = 19_321;
export const API_PORT = 19_531;
export const AI_PORT = 19_367;

/**
 * Hostnames must be `localhost` everywhere a browser cookie applies: the
 * storageState cookie jar shares a domain with the journeys' baseURL
 * (playwright.config.ts), and same-site requests to the API hosts only carry
 * the jar when the host matches. 127.0.0.1 would be a DIFFERENT cookie domain
 * and silently log every persona out between layers.
 */
export const FE_URL = `http://localhost:${FE_PORT}`;
export const API_URL = `http://localhost:${API_PORT}`;
export const AI_FAKE_URL = `http://127.0.0.1:${AI_PORT}/compatible-mode/v1`;

/** E2E-only secrets. Distinct from every real deployment; length ≥ 32. */
export const JWT_SECRET = 't18-e2e-access-secret-0123456789abcdef';
export const JWT_REFRESH_SECRET = 't18-e2e-refresh-secret-fedcba9876543210';
/** Real Stripe signature header could never be reproduced without the delivery secret. */
export const STRIPE_WEBHOOK_SECRET = 'whsec_t18_e2e_delivery_secret_0001';

/** Password policy: backend and frontend both demand ≥ 8 + upper/lower/digit. */
export const E2E_PASSWORD = 'Pl4n9e-Dr1ft-2026!';

/** The BFF session cookie is the backend access token, by contract (auth-verify.ts). */
export const SESSION_COOKIE_NAME = '__Host-auth_session';
export const REFRESH_COOKIE_NAME = '__Host-refresh_token';

// ─── Storage-state plumbing ──────────────────────────────────────────────────

export interface Persona {
    id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

export interface IndexedPersona extends Persona {
    accessToken: string;
    setCookieHeaders: string[];
    plan: string;
}

/**
 * Minimal but correct Set-Cookie → storageState cookie conversion.
 *
 * Playwright's cookie jar shape wants `domain`/`path`/`sameSite`, and the BFF
 * sets exactly three cookies across login/register (session, promoted refresh,
 * backend-scoped refresh). Anything unrecognised is preserved as best-effort —
 * a failure to represent a cookie would silently break downstream journeys, so
 * unknown cookies bid NO: they are still added, with sane defaults.
 */
export function cookiesFromSetCookie(headers: string[], secure: boolean): StorageCookie[] {
    return headers.map((header) => {
        const [pair, ...attrs] = header.split(';');
        const [name, ...rest] = pair.split('=');
        const value = rest.join('='); // JWT values contain no '=' padding, so be safe
        const lower = attrs.map((a) => a.trim().toLowerCase());

        const pathMatch = /path=(\/[^;]*)?/.exec(header);
        const sameSite = lower.some((a) => a === 'samesite=strict') ? 'Strict' : 'Lax';

        return {
            name: name?.trim() ?? '',
            value: value?.trim() ?? '',
            domain: 'localhost',
            path: pathMatch?.[1] ?? '/',
            httpOnly: lower.some((a) => a === 'httponly'),
            secure,
            sameSite,
        } satisfies StorageCookie;
    });
}

export interface StorageCookie {
    name: string;
    value: string;
    domain: string;
    path: string;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'Strict' | 'Lax';
}

export interface StorageStateFile {
    cookies: StorageCookie[];
    origins: [];
}

// ─── Persona registration (real BFF flow) ────────────────────────────────────

const EMAIL_SUFFIX = '@t18.e2e.local';

/**
 * Registers a fixture user through the frontend BFF — the same route a real
 * browser hits — and records the exact cookies it hands out. Using the BFF
 * rather than the backend directly means the storageState cookie jar is what
 * production would produce, not a privileged forgery.
 */
export async function registerPersona(fixture: {
    key: string;
    firstName: string;
    lastName: string;
    password?: string;
    forwardedFor?: string;
}): Promise<IndexedPersona> {
    const email = `${fixture.key}${EMAIL_SUFFIX}`;
    const password = fixture.password ?? E2E_PASSWORD;
    const body = {
        email,
        password,
        firstName: fixture.firstName,
        lastName: fixture.lastName,
    };

    const response = await fetch(`${FE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            ...(fixture.forwardedFor ? { 'x-forwarded-for': fixture.forwardedFor } : {}),
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`registerPersona(${fixture.key}) → ${response.status} ${text}`);
    }

    const json = (await response.json()) as {
        success?: boolean;
        data?: { user?: { id?: string } };
    };
    if (!json.data?.user?.id) {
        throw new Error(`registerPersona(${fixture.key}): unexpected response body`);
    }

    // The BFF returns only the user in the body; the access token arrives as the
    // session cookie (`auth-cookies.ts` contract) and doubles as the Bearer token
    // the backend accepts on direct API calls.
    const setCookieHeaders = response.headers.getSetCookie();
    const sessionCookie = setCookieHeaders.find((header) =>
        header.startsWith(`${SESSION_COOKIE_NAME}=`)
    );
    if (!sessionCookie) {
        throw new Error(
            `registerPersona(${fixture.key}): no ${SESSION_COOKIE_NAME} cookie issued`
        );
    }
    const accessToken = extractCookieValue(sessionCookie, SESSION_COOKIE_NAME);

    return {
        id: json.data.user.id,
        email,
        password,
        firstName: fixture.firstName,
        lastName: fixture.lastName,
        accessToken,
        setCookieHeaders,
        plan: 'starter',
    };
}

function extractCookieValue(header: string, name: string): string {
    const pair = header
        .split(';')[0]
        .trim();
    if (!pair.startsWith(`${name}=`)) {
        throw new Error(`extractCookieValue: header is not ${name}`);
    }
    return pair.slice(name.length + 1);
}

export function storageStateFor(persona: IndexedPersona): StorageStateFile {
    return { cookies: cookiesFromSetCookie(persona.setCookieHeaders, true), origins: [] };
}

// ─── Backend API helpers (bearer = the access token from register) ───────────

async function api(
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    path: string,
    persona: IndexedPersona,
    body?: unknown
): Promise<Response> {
    const headers: Record<string, string> = {
        authorization: `Bearer ${persona.accessToken}`,
    };
    if (body !== undefined) headers['content-type'] = 'application/json';

    return fetch(`${API_URL}/api/v1${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
    });
}

/**
 * Harness onboarding: one PUT per step (the same one-field-per-advance shape
 * the wizard uses), then complete. Asserting nothing about the API here — the
 * journeys do that in the browser; this just stages the fixtures.
 */
export async function completeOnboarding(persona: IndexedPersona): Promise<{
    seededProjectId: string | null;
}> {
    const first = await api('PUT', '/users/onboarding', persona, {
        niche: 'tech',
    });
    if (!first.ok) throw new Error(`onboarding niche → ${first.status}`);
    const second = await api('PUT', '/users/onboarding', persona, {
        subtopics: ['AI & ML', 'Web development', 'Mobile apps'],
    });
    if (!second.ok) throw new Error(`onboarding subtopics → ${second.status}`);
    const third = await api('PUT', '/users/onboarding', persona, { platforms: ['youtube'] });
    if (!third.ok) throw new Error(`onboarding platforms → ${third.status}`);
    const fourth = await api('PUT', '/users/onboarding', persona, { experience: 'beginner' });
    if (!fourth.ok) throw new Error(`onboarding experience → ${fourth.status}`);
    const fifth = await api('PUT', '/users/onboarding', persona, { goals: ['grow_audience'] });
    if (!fifth.ok) throw new Error(`onboarding goals → ${fifth.status}`);

    const complete = await api('POST', '/users/onboarding/complete', persona, {});
    if (!complete.ok) {
        throw new Error(`onboarding complete → ${complete.status} ${await complete.text()}`);
    }
    const json = (await complete.json()) as { data?: { seededProjectId?: string } };
    return { seededProjectId: json.data?.seededProjectId ?? null };
}

/** Stages a project directly through the backend (harness step, not a journey). */
export async function createProject(
    persona: IndexedPersona,
    title: string
): Promise<{ _id: string }> {
    const response = await api('POST', '/projects', persona, {
        title,
        idea: `E2E fixture project for ${title}.`,
        platform: 'youtube',
        tone: 'casual',
    });
    if (!response.ok) {
        throw new Error(`createProject → ${response.status} ${await response.text()}`);
    }
    const json = (await response.json()) as { data?: { _id?: string } };
    if (!json.data?._id) throw new Error('createProject: missing project id');
    return { _id: json.data._id };
}

// ─── Quota exhaustion / webhook simulation (journey 4) ───────────────────────

/**
 * Fires `POST /scripts/generate` until the starter `ai.generation` allowance is
 * gone, asserting each call while there is room. Each call costs exactly 1
 * (`requireEntitlement('ai.generation')`), so the fixed endpoint count ends at
 * the plan's quota — driven by the returned 429, not a guessed number.
 */
export async function exhaustAiQuota(
    persona: IndexedPersona,
    projectId: string,
    max = 80
): Promise<number> {
    let attempts = 0;
    for (;;) {
        attempts += 1;
        if (attempts > max) {
            throw new Error(`exhaustAiQuota: quota was not exhausted after ${max} attempts`);
        }
        const response = await api('POST', '/scripts/generate', persona, { projectId });
        if (response.status === 429) return attempts;
        if (!response.ok) {
            throw new Error(`exhaustAiQuota: unexpected ${response.status} on attempt ${attempts}`);
        }
    }
}

/**
 * Signs a Stripe webhook delivery locally with the E2E delivery secret.
 *
 * Format (`stripe.webhooks.constructEvent`'s expectation):
 * `t=<unix>,v1=hex(HMAC-SHA256(secret, t + '.' + payload))`.
 *
 * The backend's real verification path runs unchanged; only the *delivery*
 * (which would otherwise come — in test mode — from `stripe listen`) is
 * simulated.
 */
export function stripeSignatureHeader(payload: string, secret: string = STRIPE_WEBHOOK_SECRET): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const v1 = crypto
        .createHmac('sha256', secret)
        .update(`${timestamp}.${payload}`)
        .digest('hex');
    return `t=${timestamp},v1=${v1}`;
}

export interface StripeEventShape {
    id: string;
    type: string;
    object: 'event';
    data: { object: Record<string, unknown> };
}

export function stripeEvent(
    id: string,
    type: string,
    object: Record<string, unknown>
): StripeEventShape {
    return {
        id,
        type,
        object: 'event',
        data: { object },
    };
}

/**
 * Delivers a signed event to the backend's webhook route, returning the BACKEND
 * verdict. Assertions on `received`/`handled` belong to the spec.
 */
export async function deliverStripeEvent(
    event: StripeEventShape,
    secret: string = STRIPE_WEBHOOK_SECRET
): Promise<{ status: number; received: boolean; handled: boolean }> {
    const payload = JSON.stringify(event);
    const response = await fetch(`${API_URL}/api/v1/webhooks/stripe`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'stripe-signature': stripeSignatureHeader(payload, secret),
        },
        body: payload,
    });
    const json = (await response.json().catch(() => ({}))) as {
        data?: { received?: boolean; handled?: boolean };
        received?: boolean;
        handled?: boolean;
    };
    // sendSuccess wraps payload as { success, data: { received, handled } }.
    return {
        status: response.status,
        received: (json.data?.received ?? json.received) === true,
        handled: (json.data?.handled ?? json.handled) === true,
    };
}

// ─── Journey 5: forced expiry ────────────────────────────────────────────────

/**
 * Mints a correctly-signed access token whose `exp` is in the past, same
 * issuer/audience/`typ` contract as the backend (`token.service.ts`).
 *
 * This is a credential *fixture*, not an auth bypass: the cookie only ever
 * gets the browser REJECTED, which is the entire point of journey 5.
 */
export async function mintExpiredAccessToken(
    persona: Pick<IndexedPersona, 'id' | 'email'>
): Promise<StorageCookie> {
    // `jose` is a frontend dependency; Playwright runs from the frontend root.
    const { SignJWT } = await import('jose');
    const now = Math.floor(Date.now() / 1000);
    const token = await new SignJWT({
        id: persona.id,
        email: persona.email,
        role: 'user',
        ver: 1,
        typ: 'access',
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuer('c0c-bake')
        .setAudience('c0c-api')
        .setIssuedAt(now - 120)
        .setExpirationTime(now - 60)
        .sign(new TextEncoder().encode(JWT_SECRET));

    return {
        name: SESSION_COOKIE_NAME,
        value: token,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
    };
}

// ─── Fake AI provider (OpenAI-compatible) ────────────────────────────────────

const AI_TEXT_PAYLOAD = JSON.stringify({
    sections: [
        { label: 'Hook', content: 'This is a deterministic e2e hook.' },
        { label: 'Main Point 1', content: 'Deterministic e2e body content.' },
        { label: 'CTA', content: 'Deterministic e2e call to action.' },
    ],
});

const AI_TEXT_RESPONSE = {
    id: 'chatcmpl-t18-e2e',
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: 't18-e2e-mock',
    choices: [
        {
            index: 0,
            message: { role: 'assistant', content: AI_TEXT_PAYLOAD },
            finish_reason: 'stop',
        },
    ],
} as const;

/**
 * OpenAI-compatible completion server on 127.0.0.1, wired up by
 * `ALIBABA_BASE_URL`. The real Alibaba provider client (doing its own JSON
 * extraction) calls it; nothing leaves the machine.
 */
export function startFakeAiServer(): Promise<Server> {
    const handler: RequestListener = (request, response) => {
        if (request.method === 'POST' && request.url?.endsWith('/chat/completions')) {
            const chunks: Buffer[] = [];
            request.on('data', (chunk: Buffer) => chunks.push(chunk));
            request.on('end', () => {
                response.writeHead(200, { 'content-type': 'application/json' });
                response.end(JSON.stringify(AI_TEXT_RESPONSE));
            });
            return;
        }
        response.writeHead(404, { 'content-type': 'application/json' });
        response.end(JSON.stringify({ error: { message: 't18 e2e fake: unknown route' } }));
    };

    return new Promise((resolve, reject) => {
        const server = http.createServer(handler);
        server.on('error', reject);
        server.listen(AI_PORT, '127.0.0.1', () => resolve(server));
    });
}
