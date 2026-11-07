'use client';

import { useRef, useState } from 'react';
import { Download, Loader2, Music, Play, RefreshCw, Sparkles, Upload, Waves } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { TwoPanelLayout } from '@/components/shared/two-panel-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useGenerateAudio, useProjectAudio, useUploadAudio, useReplaceAudio } from '@/features/audio/hooks/use-audio';
import { useProjects } from '@/features/projects/hooks/use-projects';
import { toApiError } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { UpgradePrompt } from '@/features/billing/components/upgrade-prompt';
import { useBillingSummary } from '@/features/billing/hooks/use-billing';
import { quotaFor, usageFor } from '@/features/billing/lib/entitlements';

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
    const [externalUrl, setExternalUrl] = useState('');
    const [externalError, setExternalError] = useState<string | null>(null);
    const replaceInputRef = useRef<HTMLInputElement | null>(null);
    const billing = useBillingSummary();
    const aiUsage = usageFor(billing.data, 'ai.generation');
    const aiLimit = aiUsage?.limit ?? quotaFor(billing.data, 'ai.generation');

    const activeProjectId = projectId || projects.data?.data[0]?._id || '';
    const audio = useProjectAudio(activeProjectId);
    const generate = useGenerateAudio();
    const upload = useUploadAudio();
    const replace = useReplaceAudio();

    const suggestions = audio.data ?? [];
    // T24: current = explicit flag, newest-first fallback for legacy rows.
    const current = suggestions.find((s) => s.isCurrent) ?? suggestions[0];
    const history = suggestions.filter((s) => s.id !== current?.id);

    const ALLOWED_MIME = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'];
    const MAX_BYTES = 25 * 1024 * 1024;
    const validateFile = (file: File | undefined): string | null => {
        if (!file) return 'No file selected.';
        if (!ALLOWED_MIME.includes(file.type)) return `Unsupported audio type (${file.type || 'unknown'}). Use MP3, WAV, OGG or M4A.`;
        if (file.size > MAX_BYTES) return 'Audio file exceeds 25 MB.';
        return null;
    };
    const fileToPayload = (file: File) => ({
        fileUrl: URL.createObjectURL(file),
        format: (file.type.includes('wav') ? 'wav' : file.type.includes('ogg') ? 'ogg' : file.type.includes('mp4') ? 'm4a' : 'mp3') as 'mp3' | 'wav' | 'ogg' | 'm4a',
        fileSize: file.size,
        durationSeconds: undefined,
    });

    const onReplaceFile = (file: File | undefined) => {
        const err = validateFile(file);
        if (err) {
            setExternalError(err);
            return;
        }
        if (!current || !file) return;
        setExternalError(null);
        replace.mutate({ id: current.id, data: fileToPayload(file) });
    };

    const onUploadExternal = () => {
        setExternalError(null);
        let parsed: URL | null = null;
        try {
            parsed = new URL(externalUrl);
        } catch {
            setExternalError('Enter a valid https audio URL.');
            return;
        }
        if (parsed.protocol !== 'https:') {
            setExternalError('Audio URL must be https.');
            return;
        }
        if (!activeProjectId) return;
        upload.mutate({ projectId: activeProjectId, fileUrl: externalUrl, source: 'external' }, {
            onSuccess: () => setExternalUrl(''),
        });
    };

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
                    <label
                        key={option.id}
                        className={cn(
                            'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all',
                            mood === option.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border/50 hover:border-primary/30 hover:bg-muted/30'
                        )}
                    >
                        <div className={cn(
                            'shrink-0 rounded-lg p-2',
                            mood === option.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        )}>
                            <Music className="size-4" aria-hidden="true" />
                        </div>
                        <span className="flex-1">
                            <span className="block cursor-pointer text-sm font-semibold">{option.label}</span>
                            <span className="text-xs text-muted-foreground block">{option.description}</span>
                        </span>
                        <RadioGroupItem value={option.id} className="sr-only" />
                    </label>
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
                <UpgradePrompt
                    title="Generation quota reached"
                    description={quotaError}
                    ctaLabel="Upgrade for more generations"
                    feature="ai.generation"
                    used={aiUsage?.used}
                    limit={aiLimit}
                    resetAt={aiUsage?.resetAt}
                />
            )}
            {current && (
                <div className="space-y-3 rounded-xl border border-border/50 p-4" aria-label="Current audio">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Current audio</h4>
                        <Badge variant="secondary">{current.source ?? 'generated'}</Badge>
                    </div>
                    {current.fileUrl ? (
                        <audio controls preload="none" src={current.fileUrl} className="w-full" onError={() => setExternalError('This audio link expired — regenerate or re-upload.')} />
                    ) : (
                        <p className="text-sm text-muted-foreground">Legacy suggestion (no file). Generate or upload to get a playable asset.</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                        <input ref={replaceInputRef} type="file" accept="audio/*" className="sr-only" aria-label="Replace current audio" onChange={(e) => onReplaceFile(e.target.files?.[0])} />
                        <Button variant="outline" size="sm" className="h-11" disabled={replace.isPending || !activeProjectId} onClick={() => replaceInputRef.current?.click()}>
                            {replace.isPending ? <Loader2 className="mr-1 size-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="mr-1 size-4" aria-hidden="true" />}
                            {replace.isPending ? 'Replacing…' : 'Replace'}
                        </Button>
                        {current.fileUrl && (
                            <Button asChild variant="ghost" size="sm" className="h-11">
                                <a href={current.fileUrl} download aria-label="Download current audio">
                                    <Download className="mr-1 size-4" aria-hidden="true" /> Download
                                </a>
                            </Button>
                        )}
                    </div>
                    {externalError && <p role="alert" className="text-sm text-destructive">{externalError}</p>}
                    <div className="flex gap-2">
                        <Label htmlFor="audio-external-url" className="sr-only">External audio URL</Label>
                        <Input id="audio-external-url" placeholder="https://…/audio.mp3" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} />
                        <Button variant="outline" size="sm" className="h-11 shrink-0" disabled={upload.isPending || !externalUrl} onClick={onUploadExternal}>
                            <Upload className="mr-1 size-4" aria-hidden="true" /> Upload
                        </Button>
                    </div>
                    {history.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                            {history.length} previous version{history.length === 1 ? '' : 's'} kept as history.
                        </p>
                    )}
                </div>
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
                                <div className="flex items-center gap-3">
                                    <Button variant="secondary" size="icon" className="size-11 shrink-0" aria-label={`Play ${track.title}`}>
                                        <Play className="size-4 translate-x-0.5 fill-current" aria-hidden="true" />
                                    </Button>
                                    <div>
                                        <p className="text-sm font-semibold">{track.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {track.genre} · {track.bpm} BPM
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
