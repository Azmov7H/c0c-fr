'use client';

import type { UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';
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
    PROJECT_LIMITS,
    PROJECT_PLATFORMS,
    PROJECT_TONES,
    type ProjectFormValues,
} from '../lib/project-schemas';
import {
    formatDescription,
    formatLabel,
    platformAffects,
    platformLabel,
    platformSummary,
    toneDescription,
    toneLabel,
} from '../lib/projects-labels';

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
    const t = useTranslations('projects');
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
                            <FormLabel>{t('steps.details.titleLabel')}</FormLabel>
                            <Counter value={title} limit={PROJECT_LIMITS.title} />
                        </div>
                        <FormControl>
                            <Input
                                {...field}
                                autoFocus
                                maxLength={PROJECT_LIMITS.title}
                                placeholder={t('steps.details.titlePlaceholder')}
                                className="h-12 text-base"
                            />
                        </FormControl>
                        <FormDescription>{t('steps.details.titleHint')}</FormDescription>
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
                            <FormLabel>{t('steps.details.descriptionLabel')}</FormLabel>
                            <Counter value={description} limit={PROJECT_LIMITS.description} />
                        </div>
                        <FormControl>
                            <Textarea
                                {...field}
                                rows={3}
                                maxLength={PROJECT_LIMITS.description}
                                placeholder={t('steps.details.descriptionPlaceholder')}
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
                            <FormLabel>{t('steps.details.ideaLabel')}</FormLabel>
                            <Counter value={idea} limit={PROJECT_LIMITS.idea} />
                        </div>
                        <FormControl>
                            <Textarea
                                {...field}
                                rows={9}
                                maxLength={PROJECT_LIMITS.idea}
                                placeholder={t('steps.details.ideaPlaceholder')}
                                className="min-h-[200px] resize-y text-base"
                            />
                        </FormControl>
                        <FormDescription>
                            {t('steps.details.ideaHint')}
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
                            t('steps.details.promptSeed'),
                            { shouldDirty: true, shouldValidate: true }
                        )
                    }
                >
                    <Sparkles className="me-2 size-4" aria-hidden="true" />
                    {t('steps.details.promptButton')}
                </Button>
            ) : null}
        </div>
    );
}

export function StepPlatformTone({ form }: StepProps) {
    const t = useTranslations('projects');
    return (
        <div className="space-y-8">
            <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('steps.platformTone.platformLabel')}</FormLabel>
                        <FormControl>
                            <div role="radiogroup" aria-label={t('steps.platformTone.platformLabel')} className="grid gap-3 sm:grid-cols-3">
                                {PROJECT_PLATFORMS.map((platform) => {
                                    const selected = field.value === platform;
                                    return (
                                        <button
                                            key={platform}
                                            type="button"
                                            role="radio"
                                            aria-checked={selected}
                                            onClick={() => field.onChange(platform)}
                                            className={cn(
                                                'relative flex min-h-[132px] flex-col items-start rounded-2xl border-2 p-4 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                                selected
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border/60 bg-muted/20 hover:border-primary/40'
                                            )}
                                        >
                                            {selected ? (
                                                <Check className="absolute end-3 top-3 size-4 text-primary" aria-hidden="true" />
                                            ) : null}
                                            <span className="font-semibold">{platformLabel(t, platform)}</span>
                                            <span className="text-xs text-muted-foreground">{platformSummary(t, platform)}</span>
                                            <span className="mt-2 text-xs leading-relaxed text-foreground/70">
                                                {platformAffects(t, platform)}
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
                        <FormLabel>{t('steps.platformTone.toneLabel')}</FormLabel>
                        <FormControl>
                            <div role="radiogroup" aria-label={t('steps.platformTone.toneLabel')} className="grid gap-2 sm:grid-cols-2">
                                {PROJECT_TONES.map((tone) => {
                                    const selected = field.value === tone;
                                    return (
                                        <button
                                            key={tone}
                                            type="button"
                                            role="radio"
                                            aria-checked={selected}
                                            onClick={() => field.onChange(tone)}
                                            className={cn(
                                                'flex min-h-[72px] flex-col items-start rounded-xl border p-3 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                                selected
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border/60 hover:border-primary/40'
                                            )}
                                        >
                                            <span className="flex w-full items-center justify-between text-sm font-semibold">
                                                {toneLabel(t, tone)}
                                                {selected ? (
                                                    <Check className="size-4 text-primary" aria-hidden="true" />
                                                ) : null}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {toneDescription(t, tone)}
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

export function StepConfiguration({ form }: StepProps) {
    const t = useTranslations('projects');
    return (
        <div className="space-y-8">
            <FormField
                control={form.control}
                name="contentFormat"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('steps.configuration.formatLabel')}</FormLabel>
                        <FormControl>
                            <div role="radiogroup" aria-label={t('steps.configuration.formatLabel')} className="grid gap-3 sm:grid-cols-2">
                                {(['long', 'short'] as const).map((format) => {
                                    const selected = field.value === format;
                                    return (
                                        <button
                                            key={format}
                                            type="button"
                                            role="radio"
                                            aria-checked={selected}
                                            onClick={() => field.onChange(format)}
                                            className={cn(
                                                'flex min-h-[72px] flex-col items-start rounded-xl border p-3 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                                selected
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border/60 hover:border-primary/40'
                                            )}
                                        >
                                            <span className="text-sm font-semibold">{formatLabel(t, format)}</span>
                                            <span className="text-xs text-muted-foreground">{formatDescription(t, format)}</span>
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
                name="durationSeconds"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('steps.configuration.durationLabel')}</FormLabel>
                        <FormControl>
                            <Input
                                type="number"
                                inputMode="numeric"
                                min={15}
                                max={3600}
                                value={field.value ?? ''}
                                onChange={(event) => {
                                    const raw = event.target.value;
                                    field.onChange(raw === '' ? undefined : Number(raw));
                                }}
                                onBlur={field.onBlur}
                                name={field.name}
                                placeholder={t('steps.configuration.durationPlaceholder')}
                                className="h-12 text-base"
                            />
                        </FormControl>
                        <FormDescription>{t('steps.configuration.durationHint')}</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <p role="note" className="text-sm text-muted-foreground">
                {t('steps.configuration.unavailableNote')}
            </p>
        </div>
    );
}

function ReviewRow({
    label,
    children,
    onEdit,
    editLabel,
}: {
    label: string;
    children: React.ReactNode;
    onEdit: () => void;
    editLabel: string;
}) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-border/50 py-4 last:border-b-0">
            <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                <div className="mt-1.5 text-sm">{children}</div>
            </div>
            <Button type="button" variant="ghost" size="sm" className="h-10 shrink-0 gap-1.5" onClick={onEdit}>
                <Pencil className="size-3.5" aria-hidden="true" />
                {editLabel}
            </Button>
        </div>
    );
}

export function StepReview({
    form,
    onEdit,
}: StepProps & { onEdit: (step: 1 | 2 | 3 | 4) => void }) {
    const t = useTranslations('projects');
    const values = form.getValues();
    return (
        <div className="rounded-2xl border border-border/60 bg-muted/20 px-4">
            <ReviewRow label={t('steps.review.titleLabel')} editLabel={t('steps.review.edit')} onEdit={() => onEdit(1)}>
                <p className="font-semibold">{values.title}</p>
            </ReviewRow>
            <ReviewRow label={t('steps.review.descriptionLabel')} editLabel={t('steps.review.edit')} onEdit={() => onEdit(1)}>
                <p className="text-muted-foreground">
                    {values.description?.trim() || t('steps.review.noDescription')}
                </p>
            </ReviewRow>
            <ReviewRow label={t('steps.review.ideaLabel')} editLabel={t('steps.review.edit')} onEdit={() => onEdit(1)}>
                <p className="whitespace-pre-wrap text-foreground/80">{values.idea}</p>
            </ReviewRow>
            <ReviewRow label={t('steps.review.platformToneLabel')} editLabel={t('steps.review.edit')} onEdit={() => onEdit(2)}>
                <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{platformLabel(t, values.platform)}</Badge>
                    <Badge variant="outline">{toneLabel(t, values.tone)}</Badge>
                </div>
            </ReviewRow>
            <ReviewRow label={t('steps.review.formatDurationLabel')} editLabel={t('steps.review.edit')} onEdit={() => onEdit(3)}>
                <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{formatLabel(t, values.contentFormat ?? 'short')}</Badge>
                    <Badge variant="outline">
                        {values.durationSeconds
                            ? `${values.durationSeconds}s`
                            : t('steps.review.noDuration')}
                    </Badge>
                </div>
            </ReviewRow>
        </div>
    );
}
