'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { registerSchema } from '@/lib/auth-schemas';
import { useRegister } from '../hooks/use-auth';
import { mapAuthError } from '../lib/auth-error-map';
import { AuthErrorAlert } from './auth-error-alert';
import { AuthFormLayout } from './auth-form-layout';
import { PasswordInput } from './password-input';
import { PasswordStrengthMeter } from './password-strength-meter';

/**
 * Form-only schema: the BFF register schema plus the required terms checkbox.
 * Built from `registerSchema.shape` so the password field stays the shared
 * policy object (see password-policy.ts).
 */
const signupFormSchema = z.strictObject({
    ...registerSchema.shape,
    acceptedTerms: z
        .boolean()
        .refine((value) => value === true, 'You must accept the Terms of Service and Privacy Policy.'),
});

type SignupValues = z.infer<typeof signupFormSchema>;

/**
 * T12: the signup page is not a generic email wall — it states the
 * interest-selection value proposition up front (selection itself happens in
 * T13's onboarding), validates on blur rather than per keystroke, and shows
 * real strength feedback backed by the one shared password policy.
 */
export function SignupForm() {
    const { mutate: register, isPending, error } = useRegister();

    const form = useForm<SignupValues>({
        resolver: zodResolver(signupFormSchema),
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

    const mappedError = error
        ? mapAuthError(error, 'Failed to create your account. Please try again.')
        : null;

    return (
        <AuthFormLayout
            heading="Create Account"
            subheading="Join the next generation of AI content creators"
            title="Sign Up"
            description="One account, then pick what to build — thumbnails, scripts, sound effects and images all live in one project."
            footer={
                <p className="text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/login" className="font-bold text-primary hover:underline transition-all">
                        Sign In Instead
                    </Link>
                </p>
            }
        >
            <p className="rounded-xl bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
                Free to start. After signup you pick your interests, and your workspace opens
                ready to generate <span className="font-semibold text-foreground">Thumbnails</span>,{' '}
                <span className="font-semibold text-foreground">Scripts</span>,{' '}
                <span className="font-semibold text-foreground">Sound Effects</span> and{' '}
                <span className="font-semibold text-foreground">Images</span>.
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
                                        First Name
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            autoComplete="given-name"
                                            placeholder="Jane"
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
                                        Last Name
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            autoComplete="family-name"
                                            placeholder="Doe"
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
                                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Password
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
                                        I agree to the{' '}
                                        <Link
                                            href="/terms"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-medium text-primary hover:underline"
                                        >
                                            Terms of Service
                                        </Link>{' '}
                                        and{' '}
                                        <Link
                                            href="/privacy"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-medium text-primary hover:underline"
                                        >
                                            Privacy Policy
                                        </Link>
                                        .
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
                                <Loader2 className="h-4 w-4 mr-2 animate-spin motion-reduce:animate-none" />
                                Creating account...
                            </>
                        ) : (
                            'Create Free Account'
                        )}
                    </Button>
                </form>
            </Form>
        </AuthFormLayout>
    );
}
