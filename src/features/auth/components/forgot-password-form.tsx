'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { emailField } from '@/lib/auth-schemas';
import { useForgotPassword } from '../hooks/use-auth';
import { mapAuthError } from '../lib/auth-error-map';
import { AuthErrorAlert } from './auth-error-alert';
import { AuthFormLayout } from './auth-form-layout';

const forgotFormSchema = z.strictObject({ email: emailField });

type ForgotValues = z.infer<typeof forgotFormSchema>;

/**
 * The one confirmation copy, exported so the non-enumeration test asserts the
 * rendered text rather than a paraphrase. Identical for existing and
 * non-existing accounts; the 1-hour validity doubles as the anti-enumeration
 * detail the card asks for (it is true for every account).
 */
export const FORGOT_PASSWORD_CONFIRMATION =
    "If an account exists for that email, we've sent a reset link. The link is valid for 1 hour.";

export function ForgotPasswordForm() {
    const { mutate: forgotPassword, isPending, error } = useForgotPassword();
    const [sent, setSent] = React.useState(false);

    const form = useForm<ForgotValues>({
        resolver: zodResolver(forgotFormSchema),
        mode: 'onBlur',
        defaultValues: { email: '' },
    });

    const onSubmit = (values: ForgotValues) => {
        forgotPassword(values.email, { onSuccess: () => setSent(true) });
    };

    const mappedError = error
        ? mapAuthError(error, 'Could not send the reset email. Please try again.')
        : null;

    if (sent) {
        return (
            <AuthFormLayout
                heading="Check your inbox"
                subheading="We've got you covered"
                title="Reset Link Sent"
                description="Follow the link in the email to choose a new password."
                footer={
                    <p className="text-sm text-muted-foreground">
                        Remembered it after all?{' '}
                        <Link href="/login" className="font-bold text-primary hover:underline transition-all">
                            Back to sign in
                        </Link>
                    </p>
                }
            >
                <div
                    role="status"
                    data-testid="forgot-confirmation"
                    className="space-y-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-foreground"
                >
                    <p>{FORGOT_PASSWORD_CONFIRMATION}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                    Didn&apos;t arrive? Check spam, or try a different email address.
                </p>
                <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 rounded-xl"
                    onClick={() => {
                        setSent(false);
                        form.reset();
                    }}
                >
                    Try a different email
                </Button>
            </AuthFormLayout>
        );
    }

    return (
        <AuthFormLayout
            heading="Forgot password?"
            subheading="We'll email you a link to reset it"
            title="Reset Password"
            description="Enter the email you signed up with."
            footer={
                <p className="text-sm text-muted-foreground">
                    Remembered it after all?{' '}
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
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Email Address
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="email"
                                        autoComplete="email"
                                        placeholder="name@company.com"
                                        className="h-12 bg-muted/20 border-transparent focus-visible:bg-background focus-visible:ring-primary/20 transition-all rounded-xl px-4"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <AuthErrorAlert error={mappedError} />

                    <Button
                        type="submit"
                        className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold hover:shadow-glow active:scale-[0.98] transition-all"
                        disabled={isPending}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin motion-reduce:animate-none" />
                                Sending link...
                            </>
                        ) : (
                            'Send Reset Link'
                        )}
                    </Button>
                </form>
            </Form>
        </AuthFormLayout>
    );
}
