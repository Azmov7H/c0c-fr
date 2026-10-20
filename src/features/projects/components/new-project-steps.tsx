'use client';

import type { UseFormReturn } from 'react-hook-form';
import { Check, Pencil, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import {
    PLATFORM_CHOICES,
    PLATFORM_LABEL,
    PROJECT_LIMITS,
    TONE_CHOICES,
    TONE_LABEL,
    type ProjectFormValues,
} from '../lib/project-schemas';

interface StepProps {
    form: UseFormReturn<ProjectFormValues>;
}

function Counter({ value, limit }: { value: string; limit: number }) {
    const over = value.length > limit;
    return (
        <span
            className={cn('text-xs tabular-nums', over ? 'font-semibold text-destructive' : 'text-muted-foreground')}
            aria-live="polite"
        >
            {value.length}/{limit}
        </span>
    );
}

export function StepDetails({ form }: StepProps) {
    const title = form.watch('title') ?? '';
    const description = form.watch('description') ?? '';
    const idea = form.watch('idea') ?? '';

    return (
        <div className="space-y-7">
            <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center justify-between gap-2">
                            <FormLabel>Project title</FormLabel>
                            <Counter value={title} limit={PROJECT_LIMITS.title} />
                        </div>
                        <FormControl>
                            <Input
                                {...field}
                                autoFocus
                                maxLength={PROJECT_LIMITS.title}
                                placeholder="e.g. The future of AI in SaaS"
                                className="h-12 text-base"
                            />
                        </FormControl>
                        <FormDescription>A name you will recognise in the list.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center justify-between gap-2">
                            <FormLabel>Short description (optional)</FormLabel>
                            <Counter value={description} limit={PROJECT_LIMITS.description} />
                        </div>
                        <FormControl>
                            <Textarea
                                {...field}
                                rows={3}
                                maxLength={PROJECT_LIMITS.description}
                                placeholder="One or two lines shown on the project card."
                                className="resize-y"
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="idea"
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center justify-between gap-2">
                            <FormLabel>The idea</FormLabel>
                            <Counter value={idea} limit={PROJECT_LIMITS.idea} />
                        </div>
                        <FormControl>
                            <Textarea
                                {...field}
                                rows={9}
                                maxLength={PROJECT_LIMITS.idea}
                                placeholder="What is the video about? Who is it for, and what should they take away?"
                                className="min-h-[200px] resize-y text-base"
                            />
                        </FormControl>
                        <FormDescription>
                            This is the seed for script generation — more context means a better first draft.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {!idea.trim() ? (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-11"
                    onClick={() =>
                        form.setValue(
                            'idea',
                            'I want to make a video that explains ',
                            { shouldDirty: true, shouldValidate: true }
                        )
                    }
                >
                    <Sparkles className="mr-2 size-4" aria-hidden="true" />
                    Start from a prompt
                </Button>
            ) : null}
        </div>
    );
}

export function StepPlatformTone({ form }: StepProps) {
    return (
        <div className="space-y-8">
            <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Platform</FormLabel>
                        <FormControl>
                            <div role="radiogroup" aria-label="Platform" className="grid gap-3 sm:grid-cols-3">
                                {PLATFORM_CHOICES.map((choice) => {
                                    const selected = field.value === choice.value;
                                    return (
                                        <button
                                            key={choice.value}
                                            type="button"
                                            role="radio"
                                            aria-checked={selected}
                                            onClick={() => field.onChange(choice.value)}
                                            className={cn(
                                                'relative flex min-h-[132px] flex-col items-start rounded-2xl border-2 p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                                selected
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border/60 bg-muted/20 hover:border-primary/40'
                                            )}
                                        >
                                            {selected ? (
                                                <Check className="absolute right-3 top-3 size-4 text-primary" aria-hidden="true" />
                                            ) : null}
                                            <span className="font-semibold">{choice.label}</span>
                                            <span className="text-xs text-muted-foreground">{choice.summary}</span>
                                            <span className="mt-2 text-xs leading-relaxed text-foreground/70">
                                                {choice.affects}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="tone"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tone</FormLabel>
                        <FormControl>
                            <div role="radiogroup" aria-label="Tone" className="grid gap-2 sm:grid-cols-2">
                                {TONE_CHOICES.map((choice) => {
                                    const selected = field.value === choice.value;
                                    return (
                                        <button
                                            key={choice.value}
                                            type="button"
                                            role="radio"
                                            aria-checked={selected}
                                            onClick={() => field.onChange(choice.value)}
                                            className={cn(
                                                'flex min-h-[72px] flex-col items-start rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                                selected
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border/60 hover:border-primary/40'
                                            )}
                                        >
                                            <span className="flex w-full items-center justify-between text-sm font-semibold">
                                                {choice.label}
                                                {selected ? (
                                                    <Check className="size-4 text-primary" aria-hidden="true" />
                                                ) : null}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {choice.description}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
}

function ReviewRow({
    label,
    children,
    onEdit,
}: {
    label: string;
    children: React.ReactNode;
    onEdit: () => void;
}) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-border/50 py-4 last:border-b-0">
            <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                <div className="mt-1.5 text-sm">{children}</div>
            </div>
            <Button type="button" variant="ghost" size="sm" className="h-10 shrink-0 gap-1.5" onClick={onEdit}>
                <Pencil className="size-3.5" aria-hidden="true" />
                Edit
            </Button>
        </div>
    );
}

export function StepReview({
    form,
    onEdit,
}: StepProps & { onEdit: (step: 1 | 2) => void }) {
    const values = form.getValues();
    return (
        <div className="rounded-2xl border border-border/60 bg-muted/20 px-4">
            <ReviewRow label="Title" onEdit={() => onEdit(1)}>
                <p className="font-semibold">{values.title}</p>
            </ReviewRow>
            <ReviewRow label="Description" onEdit={() => onEdit(1)}>
                <p className="text-muted-foreground">
                    {values.description?.trim() || 'No description'}
                </p>
            </ReviewRow>
            <ReviewRow label="The idea" onEdit={() => onEdit(1)}>
                <p className="whitespace-pre-wrap text-foreground/80">{values.idea}</p>
            </ReviewRow>
            <ReviewRow label="Platform and tone" onEdit={() => onEdit(2)}>
                <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{PLATFORM_LABEL[values.platform]}</Badge>
                    <Badge variant="outline">{TONE_LABEL[values.tone]}</Badge>
                </div>
            </ReviewRow>
        </div>
    );
}
