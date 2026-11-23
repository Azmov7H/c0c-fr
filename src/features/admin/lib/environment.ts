import type { AdminEnvironment } from '../types';

/**
 * Where the admin shell is being served from.
 *
 * The badge spec (UI-UX-SPEC §2.3) is: Production (amber/red), Preview (blue),
 * Development (neutral). Detection is deliberately simple and client-side:
 * localhost is Development; the production host is Production; every other
 * vercel.app host is a Preview deploy. Anything unexpected reads as
 * Development — the safe, obviously-not-a-real-deployment answer.
 */
const PRODUCTION_HOST = 'c0c-fr.vercel.app';

export function detectAdminEnvironment(): AdminEnvironment {
    if (typeof window === 'undefined') return 'development';
    const host = window.location.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost')) {
        return 'development';
    }
    if (host === PRODUCTION_HOST) return 'production';
    if (host.endsWith('.vercel.app')) return 'preview';
    return 'development';
}
