"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateProject } from '@/features/projects/hooks/use-projects';
import {
    ArrowLeft,
    ArrowRight,
    Loader2,
    Sparkles,
    Youtube,
    Instagram,
    Zap,
    CheckCircle2,
    Layout
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const wizardSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title is too long'),
    idea: z.string().min(10, 'Please provide more details about your idea').max(2000),
    platform: z.enum(['youtube', 'tiktok', 'instagram']),
    tone: z.enum(['educational', 'dramatic', 'viral', 'storytelling', 'casual', 'professional']),
});

type WizardFormValues = z.infer<typeof wizardSchema>;

export default function NewProjectWizard() {
    const [step, setStep] = useState(1);
    const router = useRouter();
    const { mutate: createProject, isPending } = useCreateProject();

    const form = useForm<WizardFormValues>({
        resolver: zodResolver(wizardSchema),
        defaultValues: {
            title: '',
            idea: '',
            platform: 'youtube',
            tone: 'educational',
        },
        mode: 'onChange',
    });

    const nextStep = async () => {
        let isValid = false;
        if (step === 1) {
            isValid = await form.trigger(['title', 'idea']);
        } else if (step === 2) {
            isValid = await form.trigger(['platform', 'tone']);
        }
        if (isValid) setStep((s) => s + 1);
    };

    const prevStep = () => {
        setStep((s) => s - 1);
    };

    const onSubmit = (data: WizardFormValues) => {
        createProject(data, {
            onSuccess: (project: any) => {
                router.push(`/projects/${project._id}`);
            }
        });
    };

    const StepIndicator = ({ current, total }: { current: number; total: number }) => (
        <div className="flex items-center gap-3 mb-10 w-full justify-center">
            {Array.from({ length: total }).map((_, i) => (
                <React.Fragment key={i}>
                    <div className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-2xl border-2 transition-all duration-300",
                        i + 1 < current ? "bg-primary border-primary text-primary-foreground" :
                            i + 1 === current ? "border-primary text-primary shadow-glow ring-4 ring-primary/10" :
                                "border-muted text-muted-foreground bg-muted/20"
                    )}>
                        {i + 1 < current ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-sm font-bold">{i + 1}</span>}
                    </div>
                    {i < total - 1 && (
                        <div className={cn(
                            "h-1 w-12 rounded-full transition-all duration-500",
                            i + 1 < current ? "bg-primary" : "bg-muted"
                        )} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto py-10 px-4">
            {/* Back Button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="mb-8 text-muted-foreground hover:text-foreground hover:bg-muted group transition-all"
            >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Return to Workspace
            </Button>

            {/* Header */}
            <div className="text-center mb-12">
                <Badge variant="outline" className="mb-4 py-1 px-4 border-primary/20 bg-primary/5 text-primary">
                    AI Content Engine
                </Badge>
                <h2 className="text-4xl font-extrabold tracking-tight mb-2">Create New Project</h2>
                <p className="text-muted-foreground text-lg max-w-lg mx-auto">
                    {step === 1 ? "Define your project's core mission." :
                        step === 2 ? "Select your target audience settings." :
                            "Final review before we generate your workspace."}
                </p>
            </div>

            <StepIndicator current={step} total={3} />

            <Card className="glass border-border/50 shadow-premium overflow-hidden">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {/* STEP 1: Details */}
                            {step === 1 && (
                                <CardContent className="p-8 space-y-8">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Project Title</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="e.g., The Future of AI in SaaS"
                                                        className="h-14 text-xl font-semibold bg-muted/30 border-transparent focus-visible:bg-background focus-visible:ring-primary/20 transition-all rounded-xl px-6"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>A unique name to identify this project in your workspace.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="idea"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-bold uppercase tracking-wider text-muted-foreground">The Concept</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Vibrantly explain the impact of AI on digital products..."
                                                        className="min-h-[180px] text-lg bg-muted/30 border-transparent focus-visible:bg-background focus-visible:ring-primary/20 transition-all rounded-xl p-6 resize-none"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Provide details about your content goals. Our AI will use this for scripts and designs.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            )}

                            {/* STEP 2: Settings */}
                            {step === 2 && (
                                <CardContent className="p-8 space-y-10">
                                    <FormField
                                        control={form.control}
                                        name="platform"
                                        render={({ field }) => (
                                            <FormItem className="space-y-4">
                                                <FormLabel className="text-sm font-bold uppercase tracking-wider text-muted-foreground text-center block">Target Platform</FormLabel>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    {[
                                                        { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-500', bg: 'bg-red-500/10' },
                                                        { id: 'tiktok', label: 'TikTok', icon: Layout, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
                                                        { id: 'instagram', label: 'Reels', icon: Instagram, color: 'text-pink-500', bg: 'bg-pink-500/10' },
                                                    ].map((platform) => (
                                                        <div
                                                            key={platform.id}
                                                            onClick={() => field.onChange(platform.id)}
                                                            className={cn(
                                                                "group flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all cursor-pointer",
                                                                field.value === platform.id
                                                                    ? "border-primary bg-primary/5 shadow-glow"
                                                                    : "border-border/30 bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
                                                            )}
                                                        >
                                                            <div className={cn("p-4 rounded-2xl mb-4 transition-transform group-hover:scale-110", platform.bg)}>
                                                                <platform.icon className={cn("w-8 h-8", platform.color)} />
                                                            </div>
                                                            <span className="font-bold text-sm tracking-tight">{platform.label}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="tone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-bold uppercase tracking-wider text-muted-foreground text-center block mb-4">Content Tone</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-14 bg-muted/30 border-transparent focus:bg-background rounded-xl px-6 text-lg">
                                                            <SelectValue placeholder="Select a tone..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-xl overflow-hidden border-border/50">
                                                        <SelectItem value="educational">Educational & Informative</SelectItem>
                                                        <SelectItem value="storytelling">Storytelling</SelectItem>
                                                        <SelectItem value="dramatic">Dramatic & Engaging</SelectItem>
                                                        <SelectItem value="viral">Fast-paced (Viral)</SelectItem>
                                                        <SelectItem value="casual">Casual & Conversational</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription className="text-center">
                                                    This sets the personality for AI-generated scripts and voiceovers.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            )}

                            {/* STEP 3: Review */}
                            {step === 3 && (
                                <CardContent className="p-8">
                                    <div className="relative overflow-hidden bg-muted/40 p-8 rounded-3xl border border-border/50">
                                        <div className="flex flex-col gap-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div>
                                                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Project Identity</h3>
                                                    <p className="text-2xl font-extrabold text-foreground">{form.getValues('title')}</p>
                                                </div>
                                                <div className="flex gap-10">
                                                    <div>
                                                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Platform</h3>
                                                        <Badge className="h-7 px-4 bg-primary text-primary-foreground text-xs uppercase font-bold">{form.getValues('platform')}</Badge>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Tone</h3>
                                                        <Badge variant="outline" className="h-7 px-4 border-primary/20 text-primary text-xs uppercase font-bold bg-primary/5">{form.getValues('tone')}</Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="h-[1px] bg-border/50" />

                                            <div>
                                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">The Concept</h3>
                                                <div className="text-lg leading-relaxed text-foreground/80 bg-background/50 p-6 rounded-2xl border border-border/30">
                                                    {form.getValues('idea')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 p-6 bg-primary/5 border border-primary/10 rounded-2xl flex items-center gap-4">
                                        <div className="bg-primary/20 p-3 rounded-xl shrink-0">
                                            <Sparkles className="w-6 h-6 text-primary" />
                                        </div>
                                        <p className="text-sm font-medium text-primary/80">
                                            Our AI is ready to generate your first hook and script structure. This process takes approximately 5-10 seconds.
                                        </p>
                                    </div>
                                </CardContent>
                            )}
                        </div>

                        <CardFooter className="flex justify-between items-center bg-muted/30 border-t border-border/50 p-8">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={prevStep}
                                disabled={step === 1 || isPending}
                                className="h-12 px-6 rounded-xl hover:bg-muted font-bold text-muted-foreground disabled:opacity-0"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Go Back
                            </Button>

                            {step < 3 ? (
                                <Button
                                    type="button"
                                    onClick={nextStep}
                                    className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-bold hover:shadow-glow active:scale-[0.98] transition-all"
                                >
                                    Continue
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    disabled={isPending}
                                    className="h-12 px-10 rounded-xl bg-primary text-primary-foreground font-bold hover:shadow-glow active:scale-[0.98] transition-all"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Initializing Engine...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="w-4 h-4 mr-2 fill-current" />
                                            Create Workspace
                                        </>
                                    )}
                                </Button>
                            )}
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
    );
}
