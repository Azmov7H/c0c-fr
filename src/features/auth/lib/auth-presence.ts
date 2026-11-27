/**
 * AR-039 — a dependency-free "session resolved as authenticated" signal.
 *
 * `useAuthStore` imports the query client; pulling it into `LocaleSwitcher`
 * would add ~10 kB gzip to the 140 kB landing budget. The switcher only needs
 * a boolean, so the session initializer and the auth hooks publish one here.
 *
 * This is a cache, not an authority: on a route group that does not mount
 * `AppProviders` (the marketing pages), the flag is false until a click probes
 * `/api/auth/session`. The probe is click-time only and adds no first-load
 * bytes.
 */
let authenticated = false;

export function markAuthenticated(value: boolean): void {
    authenticated = value;
}

export function isAuthenticated(): boolean {
    return authenticated;
}
