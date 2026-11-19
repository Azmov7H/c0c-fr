'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useProfile, useUpdateProfile } from '../hooks/use-settings';
import { createProfileSchema, type ProfileValues } from '../lib/profile-schema';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    User,
    Shield,
    RefreshCw,
    LogOut,
    Info,
    Compass
} from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { LocalizedDataState } from '@/components/shared/localized-data-state';
import { useLogout, useLogoutAll } from '@/features/auth/hooks/use-auth';
import { ChangePasswordForm } from '@/features/auth/components/change-password-form';

const VALID_TABS = ['profile', 'security'] as const;
type SettingsTab = (typeof VALID_TABS)[number];

interface SettingsDashboardProps {
    /** Deep link support (`/settings?tab=security`) for the user menu, T10. */
    defaultTab?: string;
}

export const SettingsDashboard = ({ defaultTab }: SettingsDashboardProps) => {
    const router = useRouter();
    const t = useTranslations('settings');
    const { data: profile, isLoading } = useProfile();
    const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateProfile();
    const { mutate: logout } = useLogout();
    const { mutate: logoutAll, isPending: isLoggingOutAll } = useLogoutAll();

    const initialTab: SettingsTab = (VALID_TABS as readonly string[]).includes(defaultTab ?? '')
        ? (defaultTab as SettingsTab)
        : 'profile';

    // AR-028: the zod messages are catalog copy, so the schema is built per
    // locale instead of at module load.
    const firstNameRequired = t('validation.firstNameRequired');
    const lastNameRequired = t('validation.lastNameRequired');
    const emailInvalid = t('validation.emailInvalid');
    const firstNameTooLong = t('validation.firstNameTooLong');
    const lastNameTooLong = t('validation.lastNameTooLong');
    const emailTooLong = t('validation.emailTooLong');
    const schema = React.useMemo(
        () =>
            createProfileSchema({
                firstNameRequired,
                lastNameRequired,
                emailInvalid,
                firstNameTooLong,
                lastNameTooLong,
                emailTooLong,
            }),
        [
            firstNameRequired,
            lastNameRequired,
            emailInvalid,
            firstNameTooLong,
            lastNameTooLong,
            emailTooLong,
        ]
    );

    const form = useForm<ProfileValues>({
        resolver: zodResolver(schema),
        // `values` keeps the form in sync when the profile arrives or is
        // refetched, without a setState-in-effect reset.
        values: {
            firstName: profile?.firstName ?? '',
            lastName: profile?.lastName ?? '',
            email: profile?.email ?? '',
        },
        mode: 'onBlur',
    });

    const handleUpdateProfile = form.handleSubmit((values) => updateProfile(values));

    if (isLoading) {
        return (
            <LocalizedDataState
                isLoading
                loadingFallback={
                    <div className="space-y-8">
                        <Skeleton className="h-10 w-48" />
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                            <Skeleton className="h-64 lg:col-span-1 rounded-xl" />
                            <Skeleton className="h-96 lg:col-span-3 rounded-xl" />
                        </div>
                    </div>
                }
            >
                {null}
            </LocalizedDataState>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            <div>
                <h1 className="text-3xl font-bold">{t('header.title')}</h1>
                <p className="text-muted-foreground mt-2">{t('header.description')}</p>
            </div>
            {defaultTab && !(VALID_TABS as readonly string[]).includes(defaultTab) && (
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>{t('unknownTab.title')}</AlertTitle>
                    <AlertDescription>
                        {t('unknownTab.description')}
                    </AlertDescription>
                </Alert>
            )}

            <Tabs defaultValue={initialTab} className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

                <TabsList className="flex flex-col h-auto bg-transparent gap-2 items-start lg:col-span-1 p-0">
                    <TabsTrigger value="profile" className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 hover:bg-muted transition-all">
                        <User className="w-4 h-4" /> {t('tabs.profile')}
                    </TabsTrigger>
                    <TabsTrigger value="security" className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 hover:bg-muted transition-all">
                        <Shield className="w-4 h-4" /> {t('tabs.security')}
                    </TabsTrigger>
                    <div className="pt-4 mt-4 border-t w-full">
                        <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => logout()}>
                            <LogOut className="w-4 h-4" /> {t('tabs.logout')}
                        </Button>
                    </div>
                </TabsList>

                <div className="lg:col-span-3">
                    <TabsContent value="profile" className="mt-0 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('profile.title')}</CardTitle>
                                <CardDescription>{t('profile.description')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form {...form}>
                                    <form onSubmit={handleUpdateProfile} className="space-y-6" noValidate>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <FormField
                                                control={form.control}
                                                name="firstName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>{t('profile.firstName')}</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} autoComplete="given-name" className="h-11" />
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
                                                        <FormLabel>{t('profile.lastName')}</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} autoComplete="family-name" className="h-11" />
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
                                                    <FormLabel>{t('profile.email')}</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} type="email" autoComplete="email" className="h-11" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button type="submit" className="h-11" disabled={isUpdatingProfile || !form.formState.isDirty}>
                                            {isUpdatingProfile ? <RefreshCw className="animate-spin w-4 h-4 me-2" /> : t('profile.save')}
                                        </Button>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>

                        {/* T13: reopen the wizard without resetting completion or
                            seeding a second project (?edit=1). */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('interests.title')}</CardTitle>
                                <CardDescription>
                                    {t('interests.description')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => router.push('/onboarding?edit=1')}
                                >
                                    <Compass className="w-4 h-4" /> {t('interests.action')}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security" className="mt-0 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('security.passwordTitle')}</CardTitle>
                                <CardDescription>
                                    {t('security.passwordDescription')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChangePasswordForm />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t('security.sessionsTitle')}</CardTitle>
                                <CardDescription>{t('security.sessionsDescription')}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-wrap gap-3">
                                <Button variant="outline" className="gap-2" onClick={() => logout()}>
                                    <LogOut className="w-4 h-4" /> {t('security.signOut')}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => logoutAll()}
                                    disabled={isLoggingOutAll}
                                >
                                    <LogOut className="w-4 h-4" /> {t('security.signOutAll')}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>

            </Tabs>
        </div>
    );
};
