'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { loginSchema } from '@/lib/auth-schemas';
import { useLogin } from '../hooks/use-auth';
import { mapAuthError } from '../lib/auth-error-map';
import { authFormMessages } from '../lib/validation-messages';
import { AuthErrorAlert } from './auth-error-alert';
import { AuthFormLayout } from './auth-form-layout';
import { PasswordInput } from './password-input';

type LoginValues = z.infer<ReturnType<typeof loginSchema>>;

/**
 * Post-redirect confirmations keyed by the query param the redirect came
 * with: ?reset=1 (password reset), ?changed=1 (password change),
 * ?signout=1 (signed out everywhere), ?verified=1 (email confirmed).
 *
 * AR-026: the KEY is the code, the SENTENCE is the catalog's
 * (`login.success.<key>`).
 */
const SUCCESS_MESSAGE_KEYS = {
    reset: 'reset',
    changed: 'changed',
    signout: 'signout',
    verified: 'verified',
} as const;

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
    // AR-026: every string on this card is the catalog's.
    const t = useTranslations('auth');
    const searchParams = useSearchParams();
    const { mutate: login, isPending, error } = useLogin();

    const messages = React.useMemo(() => authFormMessages(t), [t]);
    const schema = React.useMemo(
        () => loginSchema(messages.schema),
        [messages]
    );

    const form = useForm<LoginValues>({
        resolver: zodResolver(schema),
        mode: 'onBlur',
        defaultValues: { email: '', password: '' },
    });

    const onSubmit = (values: LoginValues) => {
        login(values);
    };

    const successKey = Object.keys(SUCCESS_MESSAGE_KEYS).find((key) =>
        searchParams.has(key)
    );
    const successMessage = successKey
        ? t(`login.success.${SUCCESS_MESSAGE_KEYS[successKey as keyof typeof SUCCESS_MESSAGE_KEYS]}`)
        : null;

    // AUTH-05: a failed login always says the same thing — never a variant
    // that confirms whether an account exists.
    const mappedError = error
        ? mapAuthError(error, 'loginFallback', {
              unauthorizedKey: 'invalidCredentials',
          })
        : null;

    return (
        <AuthFormLayout
            heading={t('login.heading')}
            subheading={t('login.subheading')}
            title={t('login.title')}
            description={t('login.description')}
            footer={
                <p className="text-sm text-muted-foreground">
                    {t('login.footerPrompt')}{' '}
                    <Link href="/signup" className="font-bold text-primary hover:underline transition-all">
                        {t('login.footerLink')}
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
                                    {t('login.emailLabel')}
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
                                        {t('login.passwordLabel')}
                                    </FormLabel>
                                    <Link
                                        href="/forgot-password"
                                        className="text-xs font-bold text-primary hover:underline transition-all"
                                    >
                                        {t('login.forgotPassword')}
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
                                <Loader2 className="h-4 w-4 me-2 animate-spin motion-reduce:animate-none" />
                                {t('login.submitting')}
                            </>
                        ) : (
                            t('login.submit')
                        )}
                    </Button>
                </form>
            </Form>
        </AuthFormLayout>
    );
}
