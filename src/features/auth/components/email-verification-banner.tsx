'use client';

import * as React from 'react';
import { MailWarning } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { useResendVerification } from '../hooks/use-auth';

const RESEND_COOLDOWN_MS = 60_000;
const COOLDOWN_STORAGE_KEY = 'verify-email-resend-after';

function readCooldownUntil(): number {
    if (typeof window === 'undefined') return 0;
    const raw = window.sessionStorage.getItem(COOLDOWN_STORAGE_KEY);
    const value = raw ? Number(raw) : 0;
    return Number.isFinite(value) && value > 0 ? value : 0;
}

export function resendCooldownRemaining(until: number, now: number): number {
    return Math.max(0, Math.ceil((until - now) / 1000));
}

/**
 * Dashboard email-verification banner (T12).
 *
 * - Only for a known, unverified user (`emailVerified === false`); absent
 *   field = older session payload = say nothing.
 * - Never auto-resends; the button is the only trigger, with a 60 s cooldown
 *   persisted in sessionStorage so a reload cannot bypass it.
 * - Non-blocking: it is a banner, not a wall.
 */
export function EmailVerificationBanner() {
    const user = useAuthStore((state) => state.user);
    const { mutate: resend, isPending } = useResendVerification();

    const [cooldownUntil, setCooldownUntil] = React.useState(readCooldownUntil);
    const [now, setNow] = React.useState(() => Date.now());

    const remaining = resendCooldownRemaining(cooldownUntil, now);

    React.useEffect(() => {
        if (cooldownUntil <= Date.now()) return;
        // The interval alone drives the countdown; `onSuccess` already set
        // `now` when the cooldown started, so there is no setState here
        // (react-hooks/set-state-in-effect).
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [cooldownUntil]);

    if (!user || user.emailVerified !== false) return null;

    const handleResend = () => {
        resend(undefined, {
            onSuccess: () => {
                const until = Date.now() + RESEND_COOLDOWN_MS;
                window.sessionStorage.setItem(COOLDOWN_STORAGE_KEY, String(until));
                setCooldownUntil(until);
                setNow(Date.now());
                toast.success('Verification email sent. Check your inbox.');
            },
            onError: () => {
                toast.error('Could not send the verification email. Please try again.');
            },
        });
    };

    return (
        <div
            role="region"
            aria-label="Email verification"
            data-testid="email-verification-banner"
            className="mb-6 flex flex-col gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
            <div className="flex items-start gap-3">
                <MailWarning className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
                <div className="text-sm">
                    <p className="font-medium text-foreground">Verify your email to secure your account</p>
                    <p className="text-muted-foreground">
                        We sent a link to{' '}
                        <span className="font-medium text-foreground">{user.email}</span>.
                    </p>
                </div>
            </div>
            <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0"
                disabled={isPending || remaining > 0}
                onClick={handleResend}
            >
                {isPending ? 'Sending...' : remaining > 0 ? `Resend in ${remaining}s` : 'Resend email'}
            </Button>
        </div>
    );
}
