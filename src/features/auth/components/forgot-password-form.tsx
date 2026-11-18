'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { emailField } from '@/lib/auth-schemas';
import { useForgotPassword } from '../hooks/use-auth';
import { mapAuthError } from '../lib/auth-error-map';
import { authFormMessages } from '../lib/validation-messages';
import { AuthErrorAlert } from './auth-error-alert';
import { AuthFormLayout } from './auth-form-layout';

type ForgotValues = { email: string };

/**
 * The one confirmation copy the card shows.
 *
 * It is IDENTICAL for existing and non-existing accounts; the 1-hour validity
 * doubles as the anti-enumeration detail the card asks for (it is true for
 * every account).
 *
 * AR-026: the sentence lives in the catalog (`forgotPassword.sent.confirmation`)
 * — one key, one sentence, both languages.
 */
export function ForgotPasswordForm() {
    // AR-026: every string on this card is the catalog's.
    const t = useTranslations('auth');
    const { mutate: forgotPassword, isPending, error } = useForgotPassword();
    const [sent, setSent] = React.useState(false);

    const messages = React.useMemo(() => authFormMessages(t), [t]);
    const form = useForm<ForgotValues>({
        resolver: zodResolver(
            React.useMemo(
                () => z.strictObject({ email: emailField(messages.schema) }),
                [messages]
            )
        ),
        mode: 'onBlur',
        defaultValues: { email: '' },
    });

    const onSubmit = (values: ForgotValues) => {
        forgotPassword(values.email, { onSuccess: () => setSent(true) });
    };

    const mappedError = error ? mapAuthError(error, 'forgotFallback') : null;

    const footer = (
        <p className="text-sm text-muted-foreground">
            {t('forgotPassword.footerPrompt')}{' '}
            <Link href="/login" className="font-bold text-primary hover:underline transition-all">
                {t('forgotPassword.footerLink')}
            </Link>
        </p>
    );

    if (sent) {
        return (
            <AuthFormLayout
                heading={t('forgotPassword.sent.heading')}
                subheading={t('forgotPassword.sent.subheading')}
                title={t('forgotPassword.sent.title')}
                description={t('forgotPassword.sent.description')}
                footer={footer}
            >
                <div
                    role="status"
                    data-testid="forgot-confirmation"
                    className="space-y-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-foreground"
                >
                    <p>{t('forgotPassword.sent.confirmation')}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                    {t('forgotPassword.sent.hint')}
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
                    {t('forgotPassword.sent.retry')}
                </Button>
            </AuthFormLayout>
        );
    }

    return (
        <AuthFormLayout
            heading={t('forgotPassword.heading')}
            subheading={t('forgotPassword.subheading')}
            title={t('forgotPassword.title')}
            description={t('forgotPassword.description')}
            footer={footer}
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    {t('forgotPassword.emailLabel')}
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

                    <AuthErrorAlert error={mappedError} />

                    <Button
                        type="submit"
                        className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold hover:shadow-glow active:scale-[0.98] transition-all"
                        disabled={isPending}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 me-2 animate-spin motion-reduce:animate-none" />
                                {t('forgotPassword.submitting')}
                            </>
                        ) : (
                            t('forgotPassword.submit')
                        )}
                    </Button>
                </form>
            </Form>
        </AuthFormLayout>
    );
}
