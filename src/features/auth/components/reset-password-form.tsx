'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { passwordSchema } from '@/lib/password-policy';
import { useResetPassword } from '../hooks/use-auth';
import { mapAuthError } from '../lib/auth-error-map';
import { AuthErrorAlert } from './auth-error-alert';
import { AuthFormLayout } from './auth-form-layout';
import { PasswordInput } from './password-input';
import { PasswordStrengthMeter } from './password-strength-meter';

const resetFormSchema = z
    .strictObject({
        newPassword: passwordSchema,
        confirmPassword: z.string().min(1, 'Confirm your new password.'),
    })
    .refine((values) => values.newPassword === values.confirmPassword, {
        message: 'Passwords do not match.',
        path: ['confirmPassword'],
    });

type ResetValues = z.infer<typeof resetFormSchema>;

/** The backend's token floor is 20 chars; shorter values are malformed links. */
const TOKEN_MIN_LENGTH = 20;

/**
 * Reset-password (T12).
 *
 * Token hygiene: the token is captured from the URL on first render, then the
 * address bar is scrubbed via `router.replace` so it never reaches history,
 * referrer logs or a screenshot. The exchange itself is the POST on submit —
 * there is no GET side effect.
 *
 * Failure classes: missing (no token at all), malformed (too short to be a
 * real token), invalid/expired/used (one backend 400 — deliberately
 * indistinguishable server-side, see T12-STATUS), and success.
 */
export function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const initialToken = searchParams.get('token');
    // Captured once; the URL copy is scrubbed by the effect below.
    const [token] = React.useState<string | null>(initialToken);
    const [tokenState] = React.useState<'missing' | 'malformed' | 'ready'>(() => {
        if (!initialToken) return 'missing';
        return initialToken.length < TOKEN_MIN_LENGTH ? 'malformed' : 'ready';
    });

    React.useEffect(() => {
        if (initialToken) {
            // Scrubbed immediately; the in-memory copy is the only one left.
            router.replace('/reset-password');
        }
    }, [initialToken, router]);

    const { mutate: resetPassword, isPending, error } = useResetPassword();

    const form = useForm<ResetValues>({
        resolver: zodResolver(resetFormSchema),
        mode: 'onBlur',
        defaultValues: { newPassword: '', confirmPassword: '' },
    });

    const passwordValue = useWatch({ control: form.control, name: 'newPassword' });

    const onSubmit = (values: ResetValues) => {
        if (!token) return;
        resetPassword({ token, newPassword: values.newPassword });
    };

    const mappedError = error
        ? mapAuthError(error, 'Could not reset your password. The link may have expired — request a new one.')
        : null;

    const invalidPanel = (message: string) => (
        <AuthFormLayout
            heading="Link problem"
            subheading="This reset link can't be used"
            title="Reset Link Unusable"
            description="Request a fresh link and it will work like this one should have."
            footer={
                <p className="text-sm text-muted-foreground">
                    Prefer to sign in?{' '}
                    <Link href="/login" className="font-bold text-primary hover:underline transition-all">
                        Back to sign in
                    </Link>
                </p>
            }
        >
            <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {message}
            </div>
            <Button asChild className="w-full h-12 rounded-xl font-bold">
                <Link href="/forgot-password">Request a new reset link</Link>
            </Button>
        </AuthFormLayout>
    );

    if (tokenState === 'missing') {
        return invalidPanel('This reset link is missing its token.');
    }

    if (tokenState === 'malformed') {
        return invalidPanel("This reset link doesn't look complete — it may have been truncated by the email client.");
    }

    return (
        <AuthFormLayout
            heading="Choose a new password"
            subheading="Make it one you haven't used before"
            title="Reset Password"
            description="This signs you out everywhere and signs in nobody — you'll use the new password on the login page."
            footer={
                <p className="text-sm text-muted-foreground">
                    Changed your mind?{' '}
                    <Link href="/login" className="font-bold text-primary hover:underline transition-all">
                        Back to sign in
                    </Link>
                </p>
            }
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                    <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    New Password
                                </FormLabel>
                                <FormControl>
                                    <PasswordInput
                                        autoComplete="new-password"
                                        placeholder="••••••••"
                                        className="h-12 bg-muted/20 border-transparent focus-visible:bg-background focus-visible:ring-primary/20 transition-all rounded-xl px-4"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                                <PasswordStrengthMeter value={passwordValue} />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Confirm New Password
                                </FormLabel>
                                <FormControl>
                                    <PasswordInput
                                        autoComplete="new-password"
                                        placeholder="••••••••"
                                        className="h-12 bg-muted/20 border-transparent focus-visible:bg-background focus-visible:ring-primary/20 transition-all rounded-xl px-4"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <AuthErrorAlert error={mappedError} />

                    {mappedError ? (
                        <p className="text-center text-xs text-muted-foreground">
                            Link expired or already used?{' '}
                            <Link href="/forgot-password" className="font-medium text-primary hover:underline">
                                Request a new one
                            </Link>
                            .
                        </p>
                    ) : null}

                    <Button
                        type="submit"
                        className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold hover:shadow-glow active:scale-[0.98] transition-all"
                        disabled={isPending}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin motion-reduce:animate-none" />
                                Resetting password...
                            </>
                        ) : (
                            'Reset Password'
                        )}
                    </Button>
                </form>
            </Form>
        </AuthFormLayout>
    );
}
