/**
 * Same-origin redirect-target guard for client-side auth flows.
 *
 * `startsWith('/')` alone is not enough: `//evil.com` and `/\evil.com` parse
 * as absolute URLs once handed to `router.push` / `new URL`. This mirrors the
 * middleware's `sanitizeRedirectPath` (src/proxy.ts) so the server and
 * client agree on what a safe `?callbackUrl=` looks like (T12: both sides now
 * have tests).
 */
export function safeCallbackUrl(target: string | null | undefined): string | null {
    if (!target) return null;
    if (!/^\/($|[^/\\])/.test(target)) return null;
    return target;
}
