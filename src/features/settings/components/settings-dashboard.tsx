'use client';

import { useState } from 'react';
import { useProfile, useUpdateProfile, useUpdatePlan } from '../hooks/use-settings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    User,
    CreditCard,
    Key,
    Bell,
    Shield,
    Zap,
    Check,
    Star,
    RefreshCw,
    LogOut
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/hooks/use-auth';

export const SettingsDashboard = () => {
    const { data: profile, isLoading } = useProfile();
    const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateProfile();
    const { mutate: updatePlan, isPending: isUpdatingPlan } = useUpdatePlan();
    const { logout } = useAuth();

    const [formData, setFormData] = useState({
        firstName: profile?.firstName || '',
        lastName: profile?.lastName || '',
        email: profile?.email || '',
    });

    const handleUpdateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfile(formData);
    };

    const handleUpgrade = (plan: 'starter' | 'pro' | 'studio') => {
        updatePlan({ plan });
    };

    if (isLoading) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-10 w-48" />
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <Skeleton className="h-64 lg:col-span-1 rounded-xl" />
                    <Skeleton className="h-96 lg:col-span-3 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            <div>
                <h1 className="text-3xl font-bold text-white">System Settings</h1>
                <p className="text-muted-foreground mt-2">Manage your account preferences, billing, and API access.</p>
            </div>

            <Tabs defaultValue="profile" className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

                <TabsList className="flex flex-col h-auto bg-transparent gap-2 items-start lg:col-span-1 p-0">
                    <TabsTrigger value="profile" className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 hover:bg-white/5 transition-all">
                        <User className="w-4 h-4" /> My Profile
                    </TabsTrigger>
                    <TabsTrigger value="billing" className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 hover:bg-white/5 transition-all">
                        <CreditCard className="w-4 h-4" /> Billing & Plans
                    </TabsTrigger>
                    <TabsTrigger value="api" className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 hover:bg-white/5 transition-all">
                        <Key className="w-4 h-4" /> AI API Keys
                    </TabsTrigger>
                    <TabsTrigger value="security" className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 hover:bg-white/5 transition-all">
                        <Shield className="w-4 h-4" /> Security
                    </TabsTrigger>
                    <div className="pt-4 mt-4 border-t border-white/5 w-full">
                        <Button variant="ghost" className="w-full justify-start gap-3 text-red-400 hover:bg-red-500/10 hover:text-red-400" onClick={logout}>
                            <LogOut className="w-4 h-4" /> Logout Instance
                        </Button>
                    </div>
                </TabsList>

                <div className="lg:col-span-3">
                    <TabsContent value="profile" className="mt-0 space-y-6">
                        <Card className="border-white/5 bg-background/50 backdrop-blur-xl">
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
                                                className="bg-white/5 border-white/10"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">Last Name</Label>
                                            <Input
                                                id="lastName"
                                                defaultValue={profile?.lastName}
                                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                className="bg-white/5 border-white/10"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            defaultValue={profile?.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="bg-white/5 border-white/10"
                                        />
                                    </div>
                                    <Button type="submit" disabled={isUpdatingProfile}>
                                        {isUpdatingProfile ? <RefreshCw className="animate-spin w-4 h-4 mr-2" /> : 'Save Changes'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="billing" className="mt-0 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { id: 'starter', name: 'Starter', price: '0', icon: Zap, features: ['10 Projects/mo', 'Basic AI Models', 'Standard Export'] },
                                { id: 'pro', name: 'Pro Studio', price: '49', icon: Star, features: ['Unlimited Projects', 'Advanced AI Models', 'Priority Generation', 'Team Collaboration'] },
                                { id: 'studio', name: 'Enterprise', price: '199', icon: Shield, features: ['Custom AI Training', 'Dedicated Support', 'API Access', 'SSO & Security'] }
                            ].map((plan) => (
                                <Card key={plan.id} className={`relative overflow-hidden border-white/5 bg-background/50 transition-all ${profile?.plan === plan.id ? 'border-primary ring-1 ring-primary' : 'hover:border-white/20'}`}>
                                    {profile?.plan === plan.id && (
                                        <div className="absolute top-0 right-0 p-1 bg-primary text-white rounded-bl-lg">
                                            <Check className="w-3 h-3" />
                                        </div>
                                    )}
                                    <CardHeader>
                                        <plan.icon className={`w-8 h-8 ${profile?.plan === plan.id ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <CardTitle className="mt-4">{plan.name}</CardTitle>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-bold">${plan.price}</span>
                                            <span className="text-xs text-muted-foreground">/mo</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <ul className="space-y-2">
                                            {plan.features.map(f => (
                                                <li key={f} className="text-xs text-muted-foreground flex items-center gap-2">
                                                    <Check className="w-3 h-3 text-primary" /> {f}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            variant={profile?.plan === plan.id ? "ghost" : "default"}
                                            className="w-full"
                                            disabled={profile?.plan === plan.id || isUpdatingPlan}
                                            onClick={() => handleUpgrade(plan.id as any)}
                                        >
                                            {profile?.plan === plan.id ? 'Current Plan' : 'Select Plan'}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="api" className="mt-0 space-y-6">
                        <Card className="border-white/5 bg-background/50 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle>AI Provider Tokens</CardTitle>
                                <CardDescription>Securely store your own API keys to bypass rate limits.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="flex justify-between">
                                            <span>OpenAI API Key</span>
                                            <span className="text-[10px] text-green-500 font-mono">ENCRYPTED</span>
                                        </Label>
                                        <Input type="password" value="sk-........................" readOnly className="bg-white/5 border-white/10" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex justify-between">
                                            <span>Anthropic Key</span>
                                            <span className="text-[10px] text-muted-foreground font-mono">NOT SET</span>
                                        </Label>
                                        <Input type="password" placeholder="sk-ant-..." className="bg-white/5 border-white/10" />
                                    </div>
                                </div>
                                <Button variant="outline" className="border-white/10">Rotate All Keys</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>

            </Tabs>
        </div>
    );
};
