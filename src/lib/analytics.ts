/**
 * Auth analytics seam (T12).
 *
 * The product rule is narrow: completion events only (signup, password reset),
 * never password field contents, never keystroke-level data. No analytics
 * provider is wired yet — that decision belongs with observability (T21) — so
 * this module is the single place the provider will plug into. Components call
 * it; the no-op keeps every call site honest in review.
 */
export type AuthAnalyticsEvent = 'signup_completed' | 'password_reset_completed';

const ALLOWED_EVENTS: readonly AuthAnalyticsEvent[] = [
    'signup_completed',
    'password_reset_completed',
];

export function trackEvent(event: AuthAnalyticsEvent): void {
    if (!ALLOWED_EVENTS.includes(event)) return;

    if (process.env.NODE_ENV === 'development') {
        // Deliberately event name only — no user data, no field contents.
        console.debug(`[analytics] ${event}`);
    }
}
