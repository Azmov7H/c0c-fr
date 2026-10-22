'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Music, Play, Sparkles, Waves } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { TwoPanelLayout } from '@/components/shared/two-panel-layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { useGenerateAudio, useProjectAudio } from '@/features/audio/hooks/use-audio';
import { useProjects } from '@/features/projects/hooks/use-projects';
import { toApiError } from '@/lib/api-error';
import { cn } from '@/lib/utils';

const MOODS = [
    { id: 'energetic', label: 'Energetic & Fast', description: 'High tempo, impactful beats' },
    { id: 'suspenseful', label: 'Suspenseful Epic', description: 'Deep bass, cinematic tension' },
    { id: 'chill', label: 'Lo-fi & Chill', description: 'Relaxed vibes, atmospheric' },
    { id: 'educational', label: 'Educational', description: 'Clear, unobtrusive ambient' },
] as const;

export function AudioStudio() {
    const projects = useProjects({ limit: 100 });
    const [projectId, setProjectId] = useState('');
    const [mood, setMood] = useState('energetic');
    const [quotaError, setQuotaError] = useState<string | null>(null);

    const activeProjectId = projectId || projects.data?.data[0]?._id || '';
    const audio = useProjectAudio(activeProjectId);
    const generate = useGenerateAudio();

    const suggestions = audio.data ?? [];

    const leftContent = (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label>Project</Label>
                <Select value={activeProjectId} onValueChange={setProjectId}>
                    <SelectTrigger className="h-11" aria-label="Project">
                        <SelectValue placeholder="Choose a project" />
                    </SelectTrigger>
                    <SelectContent>
                        {(projects.data?.data ?? []).map((project) => (
                            <SelectItem key={project._id} value={project._id}>
                                {project.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <RadioGroup value={mood} onValueChange={setMood} className="grid grid-cols-1 gap-3">
                {MOODS.map((option) => (
                    <div
                        key={option.id}
                        className={cn(
                            'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all',
                            mood === option.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border/50 hover:border-primary/30 hover:bg-muted/30'
                        )}
                        onClick={() => setMood(option.id)}
                    >
                        <div className={cn(
                            'shrink-0 rounded-lg p-2',
                            mood === option.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        )}>
                            <Music className="size-4" aria-hidden="true" />
                        </div>
                        <div className="flex-1">
                            <Label className="block cursor-pointer text-sm font-semibold">{option.label}</Label>
                            <p className="text-xs text-muted-foreground">{option.description}</p>
                        </div>
                        <RadioGroupItem value={option.id} className="sr-only" />
                    </div>
                ))}
            </RadioGroup>

            <Button
                onClick={() =>
                    generate.mutate(
                        { projectId: activeProjectId },
                        {
                            onError: (error) => {
                                const apiError = toApiError(error, 'Audio generation failed.');
                                if (apiError.status === 429 || apiError.code === 'QUOTA_EXHAUSTED') {
                                    setQuotaError(apiError.message);
                                }
                            },
                        }
                    )
                }
                disabled={!activeProjectId || generate.isPending}
                className="h-11 w-full"
            >
                {generate.isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                ) : (
                    <Sparkles className="mr-2 size-4" aria-hidden="true" />
                )}
                {generate.isPending ? 'Generating…' : 'Generate audio profile'}
            </Button>
        </div>
    );

    const rightContent = (
        <div className="space-y-3">
            {quotaError && (
                <Alert>
                    <AlertTitle>Generation quota reached</AlertTitle>
                    <AlertDescription className="flex flex-wrap items-center gap-3">
                        {quotaError}
                        <Button asChild className="h-11">
                            <Link href="/settings/billing">Upgrade for more generations</Link>
                        </Button>
                    </AlertDescription>
                </Alert>
            )}
            {!activeProjectId ? (
                <p className="text-sm text-muted-foreground">Create a project first to generate audio.</p>
            ) : audio.isLoading ? (
                <p className="text-sm text-muted-foreground" role="status">Loading audio…</p>
            ) : suggestions.length === 0 ? (
                <EmptyState
                    className="min-h-0 border-0 bg-transparent p-0"
                    icon={Waves}
                    title="No audio profiles yet"
                    description="Choose a mood and generate suggestions for your selected project."
                />
            ) : (
                suggestions.map((suggestion) => (
                    <div key={suggestion.id} className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                {suggestion.mood} · {suggestion.musicType}
                            </h4>
                            <Badge variant="outline">{suggestion.status}</Badge>
                        </div>
                        {suggestion.tracks.map((track) => (
                            <div key={`${suggestion.id}-${track.title}`} className="flex items-center justify-between rounded-xl border border-border/50 p-4">
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                    {track.url ? (
                                        <audio
                                            controls
                                            preload="none"
                                            src={track.url}
                                            aria-label={`Play ${track.title}`}
                                            className="h-9 w-48 shrink-0"
                                        />
                                    ) : (
                                        <Button variant="secondary" size="icon" className="size-11 shrink-0" aria-label={`Play ${track.title}`}>
                                            <Play className="size-4 translate-x-0.5 fill-current" aria-hidden="true" />
                                        </Button>
                                    )}
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold">{track.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {track.genre}{track.bpm > 0 ? ` · ${track.bpm} BPM` : ''}
                                        </p>
                                    </div>
                                </div>
                                <p className="font-mono text-sm">{track.duration}</p>
                            </div>
                        ))}
                    </div>
                ))
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Audio Effects"
                description="Generate AI-powered music and sound suggestions for your projects."
            />
            <TwoPanelLayout
                leftTitle="Sonic architecture"
                leftDescription="Pick a project, mood and generate"
                leftIcon={Music}
                leftContent={leftContent}
                rightTitle="Audio profiles"
                rightDescription="Live suggestions from the API"
                rightContent={rightContent}
            />
        </div>
    );
}
