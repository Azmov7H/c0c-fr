'use client';

import { useEffect, useMemo } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Clock, FileText, Link2, Save, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useScript, useUpdateScript, useGenerateScript } from '../hooks/use-scripts';
import type { ScriptSection } from '../types';
import { scriptSceneLabel } from '../lib/script-labels';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const TRANSITIONS = ['cut', 'fade', 'dissolve', 'slide', 'zoom', 'none'] as const;

type SectionForm = {
    label: string;
    content: string;
    narration?: string;
    visualDirection?: string;
    transition?: (typeof TRANSITIONS)[number];
    durationSeconds?: number;
    assetIds?: string[];
};

type FormValues = { sections: SectionForm[] };

const toFormSection = (section: ScriptSection): SectionForm => ({
    label: section.label,
    content: section.content,
    narration: section.narration ?? '',
    visualDirection: section.visualDirection ?? '',
    transition: section.transition ?? 'cut',
    durationSeconds: section.durationSeconds ?? 0,
    assetIds: section.assetIds ?? [],
});

/**
 * P05.7 — per-scene editing. Every scene is editable (content, narration,
 * visual direction, transition, duration, asset links read-only until
 * P06/P07 wire them); saving replaces the list verbatim so untouched
 * scenes are preserved byte-for-byte (P05.6). RHF + Zod, no raw state
 * per field.
 *
 * AR-032: UI chrome reads the `scripts` catalog; scene labels are rendered
 * through a label→key map while the stored label value is never rewritten.
 * Content fields use `dir="auto"` so Arabic drafts shape correctly.
 */
export const ScriptEditor = ({ scriptId }: { scriptId: string }) => {
    const t = useTranslations('scripts');
    const { data: script, isLoading } = useScript(scriptId);
    const { mutate: updateScript, isPending: isUpdating } = useUpdateScript();
    const { mutate: generateScript, isPending: isGenerating } = useGenerateScript();

    const sectionSchema = useMemo(
        () =>
            z.object({
                label: z.string().min(1).max(100),
                content: z.string().max(5000),
                narration: z.string().max(5000).optional(),
                visualDirection: z.string().max(2000).optional(),
                transition: z.enum(TRANSITIONS).optional(),
                durationSeconds: z.number().int().min(0).max(3600).optional(),
                assetIds: z.array(z.string()).max(20).optional(),
            }),
        []
    );
    const formSchema = useMemo(() => z.object({ sections: z.array(sectionSchema).min(1) }), [sectionSchema]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { sections: [] },
    });
    const { fields, replace } = useFieldArray({ control: form.control, name: 'sections' });

    useEffect(() => {
        if (script) {
            replace((script.sections ?? []).map(toFormSection));
        }
    }, [script, replace]);

    const sections = useWatch({ control: form.control, name: 'sections' }) ?? [];
    const totalDuration = sections.reduce((sum, s) => sum + (s.durationSeconds ?? 0), 0);
    const wordCount = sections.reduce((sum, s) => sum + s.content.split(/\s+/).filter(Boolean).length, 0);

    const handleSave = (values: FormValues) => {
        if (!script) return;
        updateScript({
            id: scriptId,
            data: {
                sections: values.sections.map((s, index) => ({
                    order: index + 1,
                    label: s.label,
                    content: s.content,
                    narration: s.narration ?? '',
                    visualDirection: s.visualDirection ?? '',
                    transition: s.transition ?? 'cut',
                    durationSeconds: s.durationSeconds ?? 0,
                    assetIds: s.assetIds ?? [],
                })),
                wordCount,
                status: 'draft',
            },
        });
    };

    if (isLoading || !script) {
        return (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <Skeleton className="h-96 w-full rounded-[32px]" />
                </div>
                <Skeleton className="h-64 w-full rounded-[32px]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <CardTitle className="flex items-center gap-2 text-xl font-bold">
                        <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
                        {t('editor.title', { version: script.version })}
                    </CardTitle>
                    <CardDescription className="mt-1">
                        {t('editor.summary', {
                            scenes: fields.length,
                            words: wordCount,
                            seconds: totalDuration,
                        })}
                    </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="h-11 rounded-xl"
                        disabled={isGenerating}
                        onClick={() => generateScript(script.projectId)}
                    >
                        <Sparkles className={cn('me-2 h-4 w-4', isGenerating && 'animate-spin')} aria-hidden="true" />
                        {isGenerating ? t('editor.thinking') : t('editor.refine')}
                    </Button>
                    <Button
                        className="h-11 rounded-xl"
                        disabled={isUpdating || !form.formState.isDirty}
                        onClick={form.handleSubmit(handleSave)}
                    >
                        <Save className="me-2 h-4 w-4" aria-hidden="true" />
                        {isUpdating ? t('editor.saving') : t('editor.save')}
                    </Button>
                </div>
            </div>

            {form.formState.errors.sections?.root?.message && (
                <p role="alert" className="text-sm text-destructive">
                    {form.formState.errors.sections.root.message as string}
                </p>
            )}

            {fields.map((field, index) => {
                const errors = form.formState.errors.sections?.[index];
                const sceneLabel = field.label ? scriptSceneLabel(t, field.label) : t('editor.untitled');
                return (
                    <Card key={field.id} className="rounded-2xl border-border/60">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <span dir="auto">
                                    {t('editor.sceneHeading', {
                                        number: index + 1,
                                        label: sceneLabel,
                                    })}
                                </span>
                                <Badge variant="outline">{field.transition ?? 'cut'}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Labeled
                                    id={`scene-${index}-label`}
                                    label={t('editor.sectionTitle')}
                                    error={errors?.label?.message}
                                >
                                    <Input
                                        id={`scene-${index}-label`}
                                        dir="auto"
                                        value={field.label}
                                        onChange={(e) => form.setValue(`sections.${index}.label`, e.target.value, { shouldDirty: true })}
                                        className="h-11 text-base"
                                    />
                                </Labeled>
                                <div>
                                    <Label htmlFor={`scene-${index}-duration`}>
                                        {t('editor.duration')}
                                    </Label>
                                    <div className="mt-2 flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                                        <Input
                                            id={`scene-${index}-duration`}
                                            type="number"
                                            inputMode="numeric"
                                            min={0}
                                            max={3600}
                                            value={field.durationSeconds ?? 0}
                                            onChange={(e) => form.setValue(`sections.${index}.durationSeconds`, Number(e.target.value), { shouldDirty: true })}
                                            className="h-11 text-base"
                                        />
                                    </div>
                                    <FormHint error={errors?.durationSeconds?.message} />
                                </div>
                            </div>
                            <Labeled id={`scene-${index}-content`} label={t('editor.sectionText')} error={errors?.content?.message}>
                                <Textarea
                                    id={`scene-${index}-content`}
                                    dir="auto"
                                    value={field.content}
                                    onChange={(e) => form.setValue(`sections.${index}.content`, e.target.value, { shouldDirty: true })}
                                    rows={4}
                                    className="text-base"
                                />
                            </Labeled>
                            <Labeled id={`scene-${index}-narration`} label={t('editor.narration')} error={errors?.narration?.message}>
                                <Textarea
                                    id={`scene-${index}-narration`}
                                    dir="auto"
                                    value={field.narration ?? ''}
                                    onChange={(e) => form.setValue(`sections.${index}.narration`, e.target.value, { shouldDirty: true })}
                                    rows={3}
                                    className="text-base"
                                />
                            </Labeled>
                            <Labeled id={`scene-${index}-visual`} label={t('editor.visualDirection')} error={errors?.visualDirection?.message}>
                                <Textarea
                                    id={`scene-${index}-visual`}
                                    dir="auto"
                                    value={field.visualDirection ?? ''}
                                    onChange={(e) => form.setValue(`sections.${index}.visualDirection`, e.target.value, { shouldDirty: true })}
                                    rows={2}
                                    className="text-base"
                                />
                            </Labeled>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor={`scene-${index}-transition`}>{t('editor.transition')}</Label>
                                    <Select
                                        value={field.transition ?? 'cut'}
                                        onValueChange={(v) =>
                                            form.setValue(`sections.${index}.transition`, v as (typeof TRANSITIONS)[number], { shouldDirty: true })
                                        }
                                    >
                                        <SelectTrigger id={`scene-${index}-transition`} className="mt-2 h-11">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TRANSITIONS.map((tr) => (
                                                <SelectItem key={tr} value={tr}>{tr}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormHint error={errors?.transition?.message} />
                                </div>
                                <div>
                                    <Label>{t('editor.linkedAssets')}</Label>
                                    <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                                        <Link2 className="h-4 w-4" aria-hidden="true" />
                                        {(field.assetIds ?? []).length === 0
                                            ? t('editor.noLinkedAssets')
                                            : (field.assetIds ?? []).join(', ')}
                                    </p>
                                    <FormHint error={errors?.assetIds?.message} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};

function Labeled({
    id,
    label,
    error,
    children,
}: {
    id: string;
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <Label htmlFor={id}>{label}</Label>
            <div className="mt-2">{children}</div>
            <FormHint error={error} />
        </div>
    );
}

function FormHint({ error }: { error?: string }) {
    if (!error) return null;
    return (
        <p role="alert" className="mt-1 text-sm text-destructive">
            {error}
        </p>
    );
}
