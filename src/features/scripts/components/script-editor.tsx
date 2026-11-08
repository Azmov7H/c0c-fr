'use client';

import { useEffect } from 'react';
import { useFieldArray, useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Clock, FileText, Link2, Save, Sparkles } from 'lucide-react';
import { useScript, useUpdateScript, useGenerateScript } from '../hooks/use-scripts';
import type { Script, ScriptSection } from '../types';

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

const sectionSchema = z.object({
    label: z.string().min(1).max(100),
    content: z.string().max(5000),
    narration: z.string().max(5000).optional(),
    visualDirection: z.string().max(2000).optional(),
    transition: z.enum(TRANSITIONS).optional(),
    durationSeconds: z.number().int().min(0).max(3600).optional(),
    assetIds: z.array(z.string()).max(20).optional(),
});

const formSchema = z.object({ sections: z.array(sectionSchema).min(1) });
type FormValues = z.infer<typeof formSchema>;

const toFormSection = (section: ScriptSection): FormValues['sections'][number] => ({
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
 */
export const ScriptEditor = ({ scriptId }: { scriptId: string }) => {
    const { data: script, isLoading } = useScript(scriptId);
    const { mutate: updateScript, isPending: isUpdating } = useUpdateScript();
    const { mutate: generateScript, isPending: isGenerating } = useGenerateScript();

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

    const totalDuration = form
        .watch('sections')
        .reduce((sum, s) => sum + (s.durationSeconds ?? 0), 0);
    const wordCount = form
        .watch('sections')
        .reduce((sum, s) => sum + s.content.split(/\s+/).filter(Boolean).length, 0);

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
                        Script scenes (v{script.version})
                    </CardTitle>
                    <CardDescription className="mt-1">
                        {fields.length} scene(s) · {wordCount} words · {totalDuration}s estimated
                    </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="h-11 rounded-xl"
                        disabled={isGenerating}
                        onClick={() => generateScript(script.projectId)}
                    >
                        <Sparkles className={cn('mr-2 h-4 w-4', isGenerating && 'animate-spin')} aria-hidden="true" />
                        {isGenerating ? 'AI thinking…' : 'Refine with AI'}
                    </Button>
                    <Button
                        className="h-11 rounded-xl"
                        disabled={isUpdating || !form.formState.isDirty}
                        onClick={form.handleSubmit(handleSave)}
                    >
                        <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                        {isUpdating ? 'Saving…' : 'Save script'}
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
                return (
                    <Card key={field.id} className="rounded-2xl border-border/60">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                Scene {index + 1} · {field.label || 'Untitled'}
                                <Badge variant="outline">{field.transition ?? 'cut'}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Labeled
                                    id={`scene-${index}-label`}
                                    label="Section title"
                                    error={errors?.label?.message}
                                >
                                    <Input
                                        id={`scene-${index}-label`}
                                        value={field.label}
                                        onChange={(e) => form.setValue(`sections.${index}.label`, e.target.value, { shouldDirty: true })}
                                        className="h-11 text-base"
                                    />
                                </Labeled>
                                <div>
                                    <Label htmlFor={`scene-${index}-duration`}>
                                        Duration (seconds)
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
                            <Labeled id={`scene-${index}-content`} label="Section text" error={errors?.content?.message}>
                                <Textarea
                                    id={`scene-${index}-content`}
                                    value={field.content}
                                    onChange={(e) => form.setValue(`sections.${index}.content`, e.target.value, { shouldDirty: true })}
                                    rows={4}
                                    className="text-base"
                                />
                            </Labeled>
                            <Labeled id={`scene-${index}-narration`} label="Narration (voiceover)" error={errors?.narration?.message}>
                                <Textarea
                                    id={`scene-${index}-narration`}
                                    value={field.narration ?? ''}
                                    onChange={(e) => form.setValue(`sections.${index}.narration`, e.target.value, { shouldDirty: true })}
                                    rows={3}
                                    className="text-base"
                                />
                            </Labeled>
                            <Labeled id={`scene-${index}-visual`} label="Visual direction" error={errors?.visualDirection?.message}>
                                <Textarea
                                    id={`scene-${index}-visual`}
                                    value={field.visualDirection ?? ''}
                                    onChange={(e) => form.setValue(`sections.${index}.visualDirection`, e.target.value, { shouldDirty: true })}
                                    rows={2}
                                    className="text-base"
                                />
                            </Labeled>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor={`scene-${index}-transition`}>Transition</Label>
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
                                            {TRANSITIONS.map((t) => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormHint error={errors?.transition?.message} />
                                </div>
                                <div>
                                    <Label>Linked assets</Label>
                                    <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                                        <Link2 className="h-4 w-4" aria-hidden="true" />
                                        {(field.assetIds ?? []).length === 0
                                            ? 'None yet — scene links open with P06/P07.'
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
