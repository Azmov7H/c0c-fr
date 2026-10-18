'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, MailCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { authService } from '../services/auth.service';
import { useAuthStore } from '@/store/auth-store';
import { useVerifyEmail } from '../hooks/use-auth';
import { mapAuthError } from '../lib/auth-error-map';
import { AuthErrorAlert } from './auth-error-alert';
import { AuthFormLayout } from './auth-form-layout';

const TOKEN_MIN_LENGTH = 20;

/**
 * Email verification (T12).
 *
 * Not auto-fired on mount on purpose: email scanners and link previewers
 * fetch URLs, and auto-exchanging would burn the single-use token before the
 * human ever clicks. The button is the intentional act.
 *
 * The token is scrubbed from the URL on first render, same as reset.
 */
export function VerifyEmailPanel() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const setUser = useAuthStore((state) => state.setUser);

    const initialToken = searchParams.get('token');
    // Captured once; the URL copy is scrubbed by the effect below.
    const [token] = React.useState<string | null>(initialToken);
    const [tokenState] = React.useState<'missing' | 'malformed' | 'ready'>(() => {
        if (!initialToken) return 'missing';
        return initialToken.length < TOKEN_MIN_LENGTH ? 'malformed' : 'ready';
    });
    const [confirming, setConfirming] = React.useState(false);

    React.useEffect(() => {
        if (initialToken) {
            router.replace('/verify-email');
        }
    }, [initialToken, router]);

    const { mutate: verifyEmail, isPending, error } = useVerifyEmail();

    const handleConfirm = () => {
        if (!token || confirming) return;
        setConfirming(true);
        verifyEmail(token, {
            onSuccess: async () => {
                // Refresh the session so emailVerified flips to true for the
                // banner, then land the user where they belong.
                try {
                    const session = await authService.getSession();
                    if (session.authenticated && session.user) {
                        setUser(session.user);
                        router.replace('/dashboard');
                        return;
                    }
                } catch {
                    // fall through to the login redirect
                }
                router.replace('/login?verified=1');
            },
            onError: () => setConfirming(false),
        });
    };

    const mappedError = error
        ? mapAuthError(error, 'Could not verify this link. It may have expired — sign in and resend from the dashboard.')
        : null;

    if (tokenState !== 'ready') {
        return (
            <AuthFormLayout
                heading="Verify your email"
                subheading="One click and you're confirmed"
                title="Link Problem"
                description="This verification link can't be used."
                footer={
                    <p className="text-sm text-muted-foreground">
                        <Link href="/login" className="font-bold text-primary hover:underline transition-all">
                            Back to sign in
                        </Link>
                    </p>
                }
            >
                <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {tokenState === 'missing'
                        ? 'This verification link is missing its token.'
                        : "This verification link doesn't look complete — it may have been truncated by the email client."}
                </div>
                <p className="text-xs text-muted-foreground">
                    Sign in and use the resend button on your dashboard to get a fresh link.
                </p>
            </AuthFormLayout>
        );
    }

    return (
        <AuthFormLayout
            heading="Verify your email"
            subheading="Confirm it's really you"
            title="Confirm Your Email"
            description="This marks your account as verified. It takes one click."
            footer={
                <p className="text-sm text-muted-foreground">
                    <Link href="/login" className="font-bold text-primary hover:underline transition-all">
                        Back to sign in
                    </Link>
                </p>
            }
        >
            <div className="flex items-start gap-3 rounded-xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <p>
                    Verification is an engagement signal, not a lock — if this link has expired you can
                    resend it any time from your dashboard.
                </p>
            </div>

            <AuthErrorAlert error={mappedError} />

            {mappedError ? (
                <p className="text-center text-xs text-muted-foreground">
                    <Link href="/login" className="font-medium text-primary hover:underline">
                        Sign in
                    </Link>{' '}
                    and resend from the dashboard, or{' '}
                    <Link href="/forgot-password" className="font-medium text-primary hover:underline">
                        reset your password
                    </Link>
                    .
                </p>
            ) : null}

            <Button
                type="button"
                onClick={handleConfirm}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold hover:shadow-glow active:scale-[0.98] transition-all"
                disabled={isPending || confirming}
            >
                {isPending || confirming ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin motion-reduce:animate-none" />
                        Verifying...
                    </>
                ) : (
                    'Confirm Email Address'
                )}
            </Button>
        </AuthFormLayout>
    );
}
