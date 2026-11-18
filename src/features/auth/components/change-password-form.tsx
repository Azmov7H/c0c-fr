'use client';

import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { passwordSchema } from '@/lib/password-policy';
import { useChangePassword } from '../hooks/use-auth';
import { mapAuthError } from '../lib/auth-error-map';
import { authFormMessages } from '../lib/validation-messages';
import { AuthErrorAlert } from './auth-error-alert';
import { PasswordInput } from './password-input';
import { PasswordStrengthMeter } from './password-strength-meter';

type ChangePasswordValues = {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
};

/**
 * Change password (T12), lives in Settings → Security (no separate page).
 *
 * The warning is shown BEFORE submit, not as a surprise after: success signs
 * the user out everywhere (backend bumps tokenVersion + revokes refresh
 * tokens; the BFF clears both cookies) and redirects to /login.
 *
 * AR-026: every sentence on this form is the catalog's.
 */
export function ChangePasswordForm() {
    // AR-026: every string on this form is the catalog's.
    const t = useTranslations('auth');
    const { mutate: changePassword, isPending, error } = useChangePassword();

    const messages = React.useMemo(() => authFormMessages(t), [t]);
    const schema = React.useMemo(
        () =>
            z
                .strictObject({
                    currentPassword: z.string().min(1, messages.schema.currentPasswordRequired),
                    newPassword: passwordSchema(messages.schema),
                    confirmPassword: z.string().min(1, messages.confirmPasswordRequired),
                })
                .refine((values) => values.newPassword === values.confirmPassword, {
                    message: messages.passwordsMismatch,
                    path: ['confirmPassword'],
                }),
        [messages]
    );

    const form = useForm<ChangePasswordValues>({
        resolver: zodResolver(schema),
        mode: 'onBlur',
        defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    });

    const passwordValue = useWatch({ control: form.control, name: 'newPassword' });

    const onSubmit = (values: ChangePasswordValues) => {
        changePassword({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
        });
    };

    const mappedError = error ? mapAuthError(error, 'changeFallback') : null;

    return (
        <div className="space-y-6">
            <Alert className="border-warning/40 bg-warning/10">
                <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
                <AlertTitle>{t('changePassword.warningTitle')}</AlertTitle>
                <AlertDescription>{t('changePassword.warningBody')}</AlertDescription>
            </Alert>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                    <FormField
                        control={form.control}
                        name="currentPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('changePassword.currentLabel')}</FormLabel>
                                <FormControl>
                                    <PasswordInput autoComplete="current-password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('changePassword.newLabel')}</FormLabel>
                                <FormControl>
                                    <PasswordInput autoComplete="new-password" {...field} />
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
                                <FormLabel>{t('changePassword.confirmLabel')}</FormLabel>
                                <FormControl>
                                    <PasswordInput autoComplete="new-password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <AuthErrorAlert error={mappedError} />

                    <Button type="submit" disabled={isPending} className="gap-2">
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                                {t('changePassword.submitting')}
                            </>
                        ) : (
                            t('changePassword.submit')
                        )}
                    </Button>
                </form>
            </Form>
        </div>
    );
}
