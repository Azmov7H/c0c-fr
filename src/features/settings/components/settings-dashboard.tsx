'use client';

import { useState } from 'react';
import { useProfile, useUpdateProfile } from '../hooks/use-settings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    User,
    Key,
    Shield,
    RefreshCw,
    LogOut,
    Info
} from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { DataState } from '@/components/shared/data-state';
import { useLogout, useLogoutAll } from '@/features/auth/hooks/use-auth';
import { ChangePasswordForm } from '@/features/auth/components/change-password-form';

const VALID_TABS = ['profile', 'api', 'security'] as const;
type SettingsTab = (typeof VALID_TABS)[number];

interface SettingsDashboardProps {
    /** Deep link support (`/settings?tab=api`) for the user menu, T10. */
    defaultTab?: string;
}

export const SettingsDashboard = ({ defaultTab }: SettingsDashboardProps) => {
    const { data: profile, isLoading } = useProfile();
    const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateProfile();
    const { mutate: logout } = useLogout();
    const { mutate: logoutAll, isPending: isLoggingOutAll } = useLogoutAll();

    const initialTab: SettingsTab = (VALID_TABS as readonly string[]).includes(defaultTab ?? '')
        ? (defaultTab as SettingsTab)
        : 'profile';

    const [formData, setFormData] = useState({
        firstName: profile?.firstName || '',
        lastName: profile?.lastName || '',
        email: profile?.email || '',
    });

    const handleUpdateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfile(formData);
    };

    if (isLoading) {
        return (
            <DataState
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
            </DataState>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            <div>
                <h1 className="text-3xl font-bold">System Settings</h1>
                <p className="text-muted-foreground mt-2">Manage your account preferences, billing, and API access.</p>
            </div>

            <Tabs defaultValue={initialTab} className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

                <TabsList className="flex flex-col h-auto bg-transparent gap-2 items-start lg:col-span-1 p-0">
                    <TabsTrigger value="profile" className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 hover:bg-muted transition-all">
                        <User className="w-4 h-4" /> My Profile
                    </TabsTrigger>
                    <TabsTrigger value="api" className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 hover:bg-muted transition-all">
                        <Key className="w-4 h-4" /> AI API Keys
                    </TabsTrigger>
                    <TabsTrigger value="security" className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 hover:bg-muted transition-all">
                        <Shield className="w-4 h-4" /> Security
                    </TabsTrigger>
                    <div className="pt-4 mt-4 border-t w-full">
                        <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => logout()}>
                            <LogOut className="w-4 h-4" /> Logout Instance
                        </Button>
                    </div>
                </TabsList>

                <div className="lg:col-span-3">
                    <TabsContent value="profile" className="mt-0 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Personal Information</CardTitle>
                                <CardDescription>Update your public identity on the platform.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleUpdateProfile} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">First Name</Label>
                                            <Input
                                                id="firstName"
                                                defaultValue={profile?.firstName}
                                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">Last Name</Label>
                                            <Input
                                                id="lastName"
                                                defaultValue={profile?.lastName}
                                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            defaultValue={profile?.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <Button type="submit" disabled={isUpdatingProfile}>
                                        {isUpdatingProfile ? <RefreshCw className="animate-spin w-4 h-4 mr-2" /> : 'Save Changes'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security" className="mt-0 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Change Password</CardTitle>
                                <CardDescription>
                                    Update your password. For security this signs you out on every device.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChangePasswordForm />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Sessions</CardTitle>
                                <CardDescription>Sign out of this device, or everywhere at once.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-wrap gap-3">
                                <Button variant="outline" className="gap-2" onClick={() => logout()}>
                                    <LogOut className="w-4 h-4" /> Sign out of this session
                                </Button>
                                <Button
                                    variant="outline"
                                    className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => logoutAll()}
                                    disabled={isLoggingOutAll}
                                >
                                    <LogOut className="w-4 h-4" /> Sign out everywhere
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="api" className="mt-0 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>AI Provider Tokens</CardTitle>
                                <CardDescription>How model access is configured for this workspace.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertTitle>Managed server-side</AlertTitle>
                                    <AlertDescription>
                                        Provider keys are configured by the deployment and are never
                                        entered in the browser. Per-user key storage is not part of the
                                        current release.
                                    </AlertDescription>
                                </Alert>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="flex justify-between">
                                            <span>OpenAI API Key</span>
                                            <span className="text-[10px] text-muted-foreground font-mono">NOT CONFIGURED PER USER</span>
                                        </Label>
                                        <Input value="Managed by the server" readOnly disabled />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex justify-between">
                                            <span>Anthropic Key</span>
                                            <span className="text-[10px] text-muted-foreground font-mono">NOT CONFIGURED PER USER</span>
                                        </Label>
                                        <Input value="Managed by the server" readOnly disabled />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>

            </Tabs>
        </div>
    );
};
