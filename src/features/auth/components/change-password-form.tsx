'use client';

import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { z } from 'zod';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { passwordSchema } from '@/lib/password-policy';
import { useChangePassword } from '../hooks/use-auth';
import { mapAuthError } from '../lib/auth-error-map';
import { AuthErrorAlert } from './auth-error-alert';
import { PasswordInput } from './password-input';
import { PasswordStrengthMeter } from './password-strength-meter';

const changeFormSchema = z
    .strictObject({
        currentPassword: z.string().min(1, 'Current password is required.'),
        newPassword: passwordSchema,
        confirmPassword: z.string().min(1, 'Confirm your new password.'),
    })
    .refine((values) => values.newPassword === values.confirmPassword, {
        message: 'Passwords do not match.',
        path: ['confirmPassword'],
    });

type ChangePasswordValues = z.infer<typeof changeFormSchema>;

/**
 * Change password (T12), lives in Settings → Security (no separate page).
 *
 * The warning is shown BEFORE submit, not as a surprise after: success signs
 * the user out everywhere (backend bumps tokenVersion + revokes refresh
 * tokens; the BFF clears both cookies) and redirects to /login.
 */
export function ChangePasswordForm() {
    const { mutate: changePassword, isPending, error } = useChangePassword();

    const form = useForm<ChangePasswordValues>({
        resolver: zodResolver(changeFormSchema),
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

    const mappedError = error
        ? mapAuthError(error, 'Could not change your password. Please try again.')
        : null;

    return (
        <div className="space-y-6">
            <Alert className="border-warning/40 bg-warning/10">
                <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
                <AlertTitle>Changing your password signs you out everywhere</AlertTitle>
                <AlertDescription>
                    All active sessions end, including this one. You&apos;ll sign back in with the
                    new password — other devices will need it too.
                </AlertDescription>
            </Alert>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                    <FormField
                        control={form.control}
                        name="currentPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Current Password</FormLabel>
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
                                <FormLabel>New Password</FormLabel>
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
                                <FormLabel>Confirm New Password</FormLabel>
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
                                Changing password...
                            </>
                        ) : (
                            'Change Password'
                        )}
                    </Button>
                </form>
            </Form>
        </div>
    );
}
