'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { registerSchema } from '@/lib/auth-schemas';
import { useRegister } from '../hooks/use-auth';
import { mapAuthError } from '../lib/auth-error-map';
import { authFormMessages } from '../lib/validation-messages';
import { AuthErrorAlert } from './auth-error-alert';
import { AuthFormLayout } from './auth-form-layout';
import { PasswordInput } from './password-input';
import { PasswordStrengthMeter } from './password-strength-meter';

/**
 * Form-only schema: the BFF register schema plus the required terms checkbox.
 * Built from `registerSchema(...).shape` so the password field stays the
 * shared policy object (see password-policy.ts).
 *
 * AR-026: the schema is built per locale — its messages are the catalog's.
 */
type SignupValues = z.infer<ReturnType<typeof registerSchema>> & {
    acceptedTerms: boolean;
};

/**
 * T12: the signup page is not a generic email wall — it states the
 * interest-selection value proposition up front (selection itself happens in
 * T13's onboarding), validates on blur rather than per keystroke, and shows
 * real strength feedback backed by the one shared password policy.
 */
export function SignupForm() {
    // AR-026: every string on this card is the catalog's.
    const t = useTranslations('auth');
    const { mutate: register, isPending, error } = useRegister();

    const messages = React.useMemo(() => authFormMessages(t), [t]);
    const schema = React.useMemo(
        () =>
            z.strictObject({
                ...registerSchema(messages.schema).shape,
                acceptedTerms: z
                    .boolean()
                    .refine((value) => value === true, messages.termsRequired),
            }),
        [messages]
    );

    const form = useForm<SignupValues>({
        resolver: zodResolver(schema),
        mode: 'onBlur',
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            acceptedTerms: false,
        },
    });

    const passwordValue = useWatch({ control: form.control, name: 'password' });

    const onSubmit = (values: SignupValues) => {
        const { acceptedTerms: _acceptedTerms, ...credentials } = values;
        register(credentials);
    };

    const mappedError = error ? mapAuthError(error, 'signupFallback') : null;

    return (
        <AuthFormLayout
            heading={t('signup.heading')}
            subheading={t('signup.subheading')}
            title={t('signup.title')}
            description={t('signup.description')}
            footer={
                <p className="text-sm text-muted-foreground">
                    {t('signup.footerPrompt')}{' '}
                    <Link href="/login" className="font-bold text-primary hover:underline transition-all">
                        {t('signup.footerLink')}
                    </Link>
                </p>
            }
        >
            <p className="rounded-xl bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
                {t('signup.intro.lead') + ' '}
                <span className="font-semibold text-foreground">
                    {t('signup.assets.thumbnails')}
                </span>
                {t('signup.intro.separator')}
                <span className="font-semibold text-foreground">
                    {t('signup.assets.scripts')}
                </span>
                {t('signup.intro.separator')}
                <span className="font-semibold text-foreground">
                    {t('signup.assets.soundEffects')}
                </span>
                {t('signup.intro.lastSeparator')}
                <span className="font-semibold text-foreground">{t('signup.assets.images')}</span>
                {t('signup.intro.tail')}
            </p>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        {t('signup.firstNameLabel')}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            autoComplete="given-name"
                                            placeholder={t('signup.firstNamePlaceholder')}
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
                            name="lastName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        {t('signup.lastNameLabel')}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            autoComplete="family-name"
                                            placeholder={t('signup.lastNamePlaceholder')}
                                            className="h-12 bg-muted/20 border-transparent focus-visible:bg-background focus-visible:ring-primary/20 transition-all rounded-xl px-4"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    {t('signup.emailLabel')}
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="email"
                                        autoComplete="email"
                                        placeholder={t('signup.emailPlaceholder')}
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
                                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    {t('signup.passwordLabel')}
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
                        name="acceptedTerms"
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex items-start gap-3">
                                    <FormControl>
                                        <input
                                            type="checkbox"
                                            checked={field.value}
                                            onChange={(event) => field.onChange(event.target.checked)}
                                            onBlur={field.onBlur}
                                            name={field.name}
                                            ref={field.ref}
                                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal leading-snug text-muted-foreground cursor-pointer">
                                        {t('signup.termsPrefix')}{' '}
                                        <Link
                                            href="/terms"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-medium text-primary hover:underline"
                                        >
                                            {t('signup.termsLink')}
                                        </Link>{' '}
                                        {t('signup.termsMiddle')}{' '}
                                        <Link
                                            href="/privacy"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-medium text-primary hover:underline"
                                        >
                                            {t('signup.privacyLink')}
                                        </Link>
                                        {t('signup.termsTail')}
                                    </FormLabel>
                                </div>
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
                                {t('signup.submitting')}
                            </>
                        ) : (
                            t('signup.submit')
                        )}
                    </Button>
                </form>
            </Form>
        </AuthFormLayout>
    );
}
