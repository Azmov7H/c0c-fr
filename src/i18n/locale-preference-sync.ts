import { isAuthenticated, markAuthenticated } from '@/features/auth/lib/auth-presence';

import { type AppLocale } from './routing';

const SESSION_PATH = '/api/auth/session';
const PREFERENCE_PATH = '/api/v1/users/profile/preferences/locale';

async function probeAuthentication(): Promise<boolean> {
    const response = await fetch(SESSION_PATH, {
        credentials: 'same-origin',
        cache: 'no-store',
    });
    if (!response.ok) return false;
    const body = (await response.json()) as { data?: { authenticated?: boolean } };
    const authenticated = body?.data?.authenticated === true;
    if (authenticated) markAuthenticated(true);
    return authenticated;
}

/**
 * AR-039 — fire-and-forget preference write for the language switcher.
 *
 * No apiClient, no auth store: those belong to already-heavy route bundles and
 * would breach the 140 kB landing budget. The session initializer publishes a
 * boolean for app routes; marketing routes (which mount no providers) probe the
 * session once, at click time, and then use the same write path.
 *
 * The caller has already written the cookie and started the navigation. Any
 * failure here is deliberately swallowed — a preference endpoint must never
 * hold the visitor on the page they were leaving.
 */
export function syncLocalePreference(locale: AppLocale): void {
    void (async () => {
        try {
            if (!isAuthenticated() && !(await probeAuthentication())) return;
            const response = await fetch(PREFERENCE_PATH, {
                method: 'PATCH',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ locale }),
            });
            if (!response.ok) throw new Error(`preference PATCH → ${response.status}`);
        } catch {
            // Cookie and navigation are already done; that is the user-visible
            // contract. A failed sync is retried on the next explicit switch.
        }
    })();
}
