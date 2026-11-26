'use client';

import { useRef, useState } from 'react';
import { Download, Loader2, Music, Play, RefreshCw, Sparkles, Upload, Waves } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { PageHeader } from '@/components/shared/page-header';
import { TwoPanelLayout } from '@/components/shared/two-panel-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import {
    useGenerateAudio,
    useGenerateSoundMail,
    useProjectAudio,
    useUploadAudio,
    useUploadAudioFile,
    useReplaceAudioFile,
} from '@/features/audio/hooks/use-audio';
import { audioLayerOf } from '@/features/audio/types';
import { useProjects } from '@/features/projects/hooks/use-projects';
import { toApiError } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { UpgradePrompt } from '@/features/billing/components/upgrade-prompt';
import { useBillingSummary } from '@/features/billing/hooks/use-billing';
import { quotaFor, usageFor } from '@/features/billing/lib/entitlements';

const MOOD_DEFS = [
    { id: 'energetic', key: 'energeticFast' },
    { id: 'suspenseful', key: 'suspensefulEpic' },
    { id: 'chill', key: 'lofiChill' },
    { id: 'educational', key: 'educational' },
] as const;

export function AudioStudio() {
    const t = useTranslations('audio');
    // Static key refs for i18n checker (keys used dynamically in mood map).
    void [
        t('page.aiPowered'),
        t('moods.energeticFast.label'),
        t('moods.energeticFast.description'),
        t('moods.suspensefulEpic.label'),
        t('moods.suspensefulEpic.description'),
        t('moods.lofiChill.label'),
        t('moods.lofiChill.description'),
        t('moods.educational.label'),
        t('moods.educational.description'),
    ];
    const projects = useProjects({ limit: 100 });
    const [projectId, setProjectId] = useState('');
    const [mood, setMood] = useState('energetic');
    const [quotaError, setQuotaError] = useState<string | null>(null);
    const [externalUrl, setExternalUrl] = useState('');
    const [externalError, setExternalError] = useState<string | null>(null);
    const [soundMailText, setSoundMailText] = useState('');
    const [soundMailError, setSoundMailError] = useState<string | null>(null);
    const replaceInputRef = useRef<HTMLInputElement | null>(null);
    const soundMailInputRef = useRef<HTMLInputElement | null>(null);
    const billing = useBillingSummary();
    const aiUsage = usageFor(billing.data, 'ai.generation');
    const aiLimit = aiUsage?.limit ?? quotaFor(billing.data, 'ai.generation');

    const activeProjectId = projectId || projects.data?.data[0]?._id || '';
    const audio = useProjectAudio(activeProjectId);
    const generate = useGenerateAudio();
    const upload = useUploadAudio();
    const replaceFile = useReplaceAudioFile();
    const uploadFile = useUploadAudioFile();
    const generateSoundMail = useGenerateSoundMail();

    const suggestions = audio.data ?? [];
    // T24: current = explicit flag, newest-first fallback for legacy rows.
    const current = suggestions.find((s) => s.isCurrent) ?? suggestions[0];
    const history = suggestions.filter((s) => s.id !== current?.id);
    const soundMailRows = suggestions.filter((s) => audioLayerOf(s) === 'soundmail');

    const ALLOWED_MIME = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'];
    const MAX_BYTES = 25 * 1024 * 1024;
    const validateFile = (file: File | undefined): string | null => {
        if (!file) return t('validation.noFile');
        if (!ALLOWED_MIME.includes(file.type)) return t('validation.unsupportedType', { type: file.type || 'unknown' });
        if (file.size > MAX_BYTES) return t('validation.tooLarge');
        return null;
    };
    const onReplaceFile = (file: File | undefined) => {
        const err = validateFile(file);
        if (err) {
            setExternalError(err);
            return;
        }
        if (!current || !file || !activeProjectId) return;
        setExternalError(null);
        replaceFile.mutate({
            id: current.id,
            projectId: activeProjectId,
            file,
            assetType: audioLayerOf(current),
        });
    };

    const onSoundMailFile = (file: File | undefined) => {
        const err = validateFile(file);
        if (err) {
            setSoundMailError(err);
            return;
        }
        if (!file || !activeProjectId) return;
        setSoundMailError(null);
        uploadFile.mutate({ projectId: activeProjectId, file, assetType: 'soundmail' });
    };

    const onGenerateSoundMail = () => {
        if (!activeProjectId) return;
        setSoundMailError(null);
        generateSoundMail.mutate(
            {
                projectId: activeProjectId,
                ...(soundMailText.trim() ? { text: soundMailText.trim() } : {}),
            },
            {
                onError: (error) => {
                    if (toApiError(error, '').code === 'AI_VOICE_GATED') {
                        setSoundMailError(t('soundMail.gated'));
                    }
                },
            }
        );
    };

    const onUploadExternal = () => {
        setExternalError(null);
        let parsed: URL | null = null;
        try {
            parsed = new URL(externalUrl);
        } catch {
            setExternalError(t('validation.invalidUrl'));
            return;
        }
        if (parsed.protocol !== 'https:') {
            setExternalError(t('validation.urlMustBeHttps'));
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
                <Label>{t('studio.projectAria')}</Label>
                <Select value={activeProjectId} onValueChange={setProjectId}>
                    <SelectTrigger className="h-11" aria-label={t('studio.projectAria')}>
                        <SelectValue placeholder={t('studio.projectPlaceholder')} />
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
                {MOOD_DEFS.map((option) => (
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
                            <span className="block cursor-pointer text-sm font-semibold">{t(`moods.${option.key}.label`)}</span>
                            <span className="text-xs text-muted-foreground block">{t(`moods.${option.key}.description`)}</span>
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
                    <Loader2 className="me-2 size-4 animate-spin" aria-hidden="true" />
                ) : (
                    <Sparkles className="me-2 size-4" aria-hidden="true" />
                )}
                {generate.isPending ? t('studio.generating') : t('studio.generate')}
            </Button>

            <div className="space-y-3 rounded-xl border border-border/50 p-4">
                <div className="space-y-1">
                    <h3 className="text-sm font-semibold">{t('soundMail.title')}</h3>
                    <p className="text-xs text-muted-foreground">{t('soundMail.description')}</p>
                </div>
                <Label htmlFor="sound-mail-text" className="sr-only">{t('soundMail.textLabel')}</Label>
                <Textarea
                    id="sound-mail-text"
                    dir="auto"
                    value={soundMailText}
                    onChange={(event) => setSoundMailText(event.target.value)}
                    placeholder={t('soundMail.textPlaceholder')}
                    className="min-h-24 resize-none"
                />
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-11"
                        disabled={!activeProjectId || generateSoundMail.isPending || uploadFile.isPending}
                        onClick={onGenerateSoundMail}
                    >
                        {generateSoundMail.isPending ? (
                            <Loader2 className="me-2 size-4 animate-spin" aria-hidden="true" />
                        ) : (
                            <Sparkles className="me-2 size-4" aria-hidden="true" />
                        )}
                        {generateSoundMail.isPending ? t('soundMail.generating') : t('soundMail.generate')}
                    </Button>
                    <input
                        ref={soundMailInputRef}
                        type="file"
                        accept="audio/*"
                        className="sr-only"
                        aria-label={t('soundMail.uploadAria')}
                        onChange={(event) => onSoundMailFile(event.target.files?.[0])}
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-11"
                        disabled={!activeProjectId || uploadFile.isPending || generateSoundMail.isPending}
                        onClick={() => soundMailInputRef.current?.click()}
                    >
                        {uploadFile.isPending ? (
                            <Loader2 className="me-2 size-4 animate-spin" aria-hidden="true" />
                        ) : (
                            <Upload className="me-2 size-4" aria-hidden="true" />
                        )}
                        {uploadFile.isPending ? t('soundMail.uploading') : t('soundMail.upload')}
                    </Button>
                </div>
                {soundMailError ? (
                    <p role="alert" className="text-sm text-destructive">{soundMailError}</p>
                ) : null}
            </div>
        </div>
    );

    const rightContent = (
        <div className="space-y-3">
            {quotaError && (
                <UpgradePrompt
                    title={t('studio.quotaTitle')}
                    description={quotaError}
                    ctaLabel={t('studio.quotaCta')}
                    feature="ai.generation"
                    used={aiUsage?.used}
                    limit={aiLimit}
                    resetAt={aiUsage?.resetAt}
                />
            )}
            {soundMailRows.length > 0 ? (
                <div className="space-y-3 rounded-xl border border-border/50 p-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        {t('soundMail.title')}
                    </h4>
                    {soundMailRows.map((row) => (
                        <div key={row.id} className="space-y-2">
                            <Badge variant="outline">{row.source ?? t('studio.generatedFallback')}</Badge>
                            {row.fileUrl ? (
                                <audio
                                    controls
                                    dir="ltr"
                                    preload="none"
                                    src={row.fileUrl}
                                    className="w-full"
                                    aria-label={t('soundMail.playAria', { title: row.musicType || row.id })}
                                    onError={() => setExternalError(t('studio.expired'))}
                                />
                            ) : (
                                <p className="text-sm text-muted-foreground">{t('studio.legacySuggestion')}</p>
                            )}
                        </div>
                    ))}
                </div>
            ) : null}
            {current && (
                <div className="space-y-3 rounded-xl border border-border/50 p-4" aria-label={t('studio.currentAudioAria')}>
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('studio.currentAudio')}</h4>
                        <Badge variant="secondary">{current.source ?? t('studio.generatedFallback')}</Badge>
                    </div>
                    {current.fileUrl ? (
                        <audio controls dir="ltr" preload="none" src={current.fileUrl} className="w-full" onError={() => setExternalError(t('studio.expired'))} />
                    ) : (
                        <p className="text-sm text-muted-foreground">{t('studio.legacySuggestion')}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                        <input ref={replaceInputRef} type="file" accept="audio/*" className="sr-only" aria-label={t('studio.replaceAria')} onChange={(e) => onReplaceFile(e.target.files?.[0])} />
                        <Button variant="outline" size="sm" className="h-11" disabled={replaceFile.isPending || !activeProjectId} onClick={() => replaceInputRef.current?.click()}>
                            {replaceFile.isPending ? <Loader2 className="me-1 size-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="me-1 size-4" aria-hidden="true" />}
                            {replaceFile.isPending ? t('studio.replacing') : t('studio.replace')}
                        </Button>
                        {current.fileUrl && (
                            <Button asChild variant="ghost" size="sm" className="h-11">
                                <a href={current.fileUrl} download aria-label={t('studio.downloadAria')}>
                                    <Download className="me-1 size-4" aria-hidden="true" /> {t('studio.download')}
                                </a>
                            </Button>
                        )}
                    </div>
                    {externalError && <p role="alert" className="text-sm text-destructive">{externalError}</p>}
                    <div className="flex gap-2">
                        <Label htmlFor="audio-external-url" className="sr-only">{t('studio.externalUrlLabel')}</Label>
                        <Input id="audio-external-url" placeholder={t('studio.externalUrlPlaceholder')} value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} />
                        <Button variant="outline" size="sm" className="h-11 shrink-0" disabled={upload.isPending || !externalUrl} onClick={onUploadExternal}>
                            <Upload className="me-1 size-4" aria-hidden="true" /> {t('studio.upload')}
                        </Button>
                    </div>
                    {history.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                            {t('studio.historyVersions', { count: history.length })}
                        </p>
                    )}
                </div>
            )}
            {!activeProjectId ? (
                <p className="text-sm text-muted-foreground">{t('studio.createProjectFirst')}</p>
            ) : audio.isLoading ? (
                <p className="text-sm text-muted-foreground" role="status">{t('studio.loading')}</p>
            ) : suggestions.length === 0 ? (
                <EmptyState
                    className="min-h-0 border-0 bg-transparent p-0"
                    icon={Waves}
                    title={t('studio.emptyTitle')}
                    description={t('studio.emptyDescription')}
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
                                    <Button variant="secondary" size="icon" className="size-11 shrink-0" aria-label={t('studio.playTrack', { title: track.title })}>
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
                title={t('page.title')}
                description={t('page.description')}
            />
            <TwoPanelLayout
                leftTitle={t('studio.sonicTitle')}
                leftDescription={t('studio.sonicDescription')}
                leftIcon={Music}
                leftContent={leftContent}
                rightTitle={t('studio.profilesTitle')}
                rightDescription={t('studio.profilesDescription')}
                rightContent={rightContent}
            />
        </div>
    );
}
