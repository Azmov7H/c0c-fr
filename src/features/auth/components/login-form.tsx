'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { loginSchema } from '@/lib/auth-schemas';
import { useLogin } from '../hooks/use-auth';
import { LOGIN_GENERIC_ERROR, mapAuthError } from '../lib/auth-error-map';
import { AuthErrorAlert } from './auth-error-alert';
import { AuthFormLayout } from './auth-form-layout';
import { PasswordInput } from './password-input';

type LoginValues = z.infer<typeof loginSchema>;

/**
 * Post-redirect confirmation messages keyed by the query param the redirect
 * came with: ?reset=1 (password reset), ?changed=1 (password change),
 * ?signout=1 (signed out everywhere), ?verified=1 (email confirmed).
 */
const SUCCESS_MESSAGES: Record<string, string> = {
    reset: 'Your password has been reset. Sign in with your new password.',
    changed: 'Password changed. For security, every device was signed out — sign in again.',
    signout: 'You have been signed out on all devices.',
    verified: 'Email verified. Sign in to continue.',
};

/**
 * T12 decisions encoded here:
 * - No "remember me": the session cookie already lasts 7 days; extending it
 *   only widens the blast radius of a stolen device.
 * - No social login buttons: OAuth is its own card; dead buttons are worse
 *   than none.
 * - Failed login is ALWAYS "Invalid email or password." — never a variant
 *   that confirms whether an account exists.
 */
export function LoginForm() {
    const searchParams = useSearchParams();
    const { mutate: login, isPending, error } = useLogin();

    const form = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        mode: 'onBlur',
        defaultValues: { email: '', password: '' },
    });

    const onSubmit = (values: LoginValues) => {
        login(values);
    };

    const successKey = Object.keys(SUCCESS_MESSAGES).find((key) => searchParams.has(key));
    const successMessage = successKey ? SUCCESS_MESSAGES[successKey] : null;

    const mappedError = error
        ? mapAuthError(error, 'Failed to sign in. Please try again.', {
              unauthorizedMessage: LOGIN_GENERIC_ERROR,
          })
        : null;

    return (
        <AuthFormLayout
            heading="Welcome back"
            subheading="Empower your content with Arch-AI"
            title="Sign In"
            description="Enter your credentials to access your workspace"
            footer={
                <p className="text-sm text-muted-foreground">
                    New to Arch-AI?{' '}
                    <Link href="/signup" className="font-bold text-primary hover:underline transition-all">
                        Create Free Account
                    </Link>
                </p>
            }
        >
            {successMessage ? (
                <div
                    role="status"
                    data-testid="login-success"
                    className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-foreground"
                >
                    {successMessage}
                </div>
            ) : null}

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

                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex items-center justify-between">
                                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Password
                                    </FormLabel>
                                    <Link
                                        href="/forgot-password"
                                        className="text-xs font-bold text-primary hover:underline transition-all"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <FormControl>
                                    <PasswordInput
                                        autoComplete="current-password"
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

                    <Button
                        type="submit"
                        className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold hover:shadow-glow active:scale-[0.98] transition-all"
                        disabled={isPending}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin motion-reduce:animate-none" />
                                Authenticating...
                            </>
                        ) : (
                            'Sign In to Dashboard'
                        )}
                    </Button>
                </form>
            </Form>
        </AuthFormLayout>
    );
}
