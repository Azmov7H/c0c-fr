'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useProjectThumbnails, useCreateThumbnail } from '../hooks/use-thumbnails';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
    Image as ImageIcon,
    Download,
    RefreshCw,
    Palette,
    Sparkles,
    Box,
    Film,
    Minimize2,
    Loader2
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ThumbnailStyle } from '../types';
import { cn } from '@/lib/utils';
import { UnsplashAttribution } from '@/features/images/components/unsplash-attribution';
import { unsplashMetadataFromPhoto, type UnsplashPhoto } from '@/features/images/types';
import dynamic from 'next/dynamic';

/**
 * P07-T40 — lazy-loaded so the image-search modal (and its fetch plumbing) is
 * not in the bundle until the user actually opens the picker. `ssr:false`
 * because the dialog is client-only.
 */
const ImagePicker = dynamic(
    () => import('@/features/images/components/image-picker').then((m) => m.ImagePicker),
    { ssr: false }
);

interface ThumbnailGeneratorProps {
    projectId: string;
}

const STYLE_OPTIONS = [
    { id: '3d-render' as const, icon: Box },
    { id: 'cinematic' as const, icon: Film },
    { id: 'minimalist' as const, icon: Minimize2 },
];

export const ThumbnailGenerator = ({ projectId }: ThumbnailGeneratorProps) => {
    const t = useTranslations('thumbnails');
    void [
        t('styles.3d-render.label'),
        t('styles.3d-render.description'),
        t('styles.cinematic.label'),
        t('styles.cinematic.description'),
        t('styles.minimalist.label'),
        t('styles.minimalist.description'),
    ];
    const [prompt, setPrompt] = useState('');
    const [stylePreset, setStylePreset] = useState<ThumbnailStyle>('3d-render');
    const [photo, setPhoto] = useState<UnsplashPhoto | null>(null);

    const { data: thumbnails, isLoading } = useProjectThumbnails(projectId);
    const { mutate: generateThumbnail, isPending: isGenerating } = useCreateThumbnail();

    const handleGenerate = () => {
        if (!prompt.trim()) return;
        generateThumbnail({
            projectId,
            prompt,
            stylePreset,
            ...(photo ? { image: photo } : {}),
        });
    };

    const activeThumbnail = thumbnails?.[0];

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-[400px] w-full rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Left: Configuration & Controls */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 start-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors duration-500" />

                <CardHeader>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                            <Palette className="w-5 h-5" />
                        </div>
                        <CardTitle className="text-2xl font-black tracking-tight">{t('generator.visualCore')}</CardTitle>
                    </div>
                    <CardDescription className="text-muted-foreground font-medium">
                        {t('generator.visualCoreDescription')}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-8">
                    {/* Prompt Input */}
                    <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-primary" />
                            {t('generator.directive')}
                        </Label>
                        <Textarea
                            placeholder={t('generator.directivePlaceholder')}
                            className="min-h-[120px] bg-background/50 border-border/50 focus:border-primary/50 transition-all rounded-xl resize-none text-foreground font-medium placeholder:text-muted-foreground/30 leading-relaxed"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                        <div className="flex justify-between items-center px-1">
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                                {t('generator.chars', { count: prompt.length })}
                            </span>
                        </div>
                    </div>

                    {/* Style Preset */}
                    <div className="space-y-4">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                            {t('generator.visualFrequency')}
                        </Label>
                        <RadioGroup
                            value={stylePreset}
                            onValueChange={(val) => setStylePreset(val as ThumbnailStyle)}
                            className="grid grid-cols-3 gap-4"
                        >
                            {STYLE_OPTIONS.map((style) => (
                                <div key={style.id}>
                                    <RadioGroupItem
                                        value={style.id}
                                        id={style.id}
                                        className="peer sr-only"
                                    />
                                    <Label
                                        htmlFor={style.id}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer h-full gap-3",
                                            "bg-background/50 border-border/50 text-muted-foreground hover:bg-accent/50 hover:border-primary/30",
                                            "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-primary peer-data-[state=checked]:shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]"
                                        )}
                                    >
                                        <style.icon className="w-6 h-6" />
                                        <div className="text-center">
                                            <p className="text-[11px] font-black uppercase tracking-tight mb-1">{t(`styles.${style.id}.label`)}</p>
                                            <p className="text-[9px] font-medium leading-tight opacity-70">{t(`styles.${style.id}.description`)}</p>
                                        </div>
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    {/* Reference photo (Unsplash) — P07-T40. Optional: sending a photo
                        drives the generation into the photo-edit path. */}
                    <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <ImageIcon className="w-3 h-3 text-primary" />
                            {t('generator.thePhotograph')}
                        </Label>
                        {photo ? (
                            <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/50 p-2 pe-3">
                                {/* Unsplash thumb URL, not a local asset */}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={photo.thumbnailUrl}
                                    alt={photo.altDescription || photo.photographerName}
                                    className="h-16 w-24 rounded-lg object-cover"
                                />
                                <div className="min-w-0 flex-1 space-y-1">
                                    <UnsplashAttribution photo={unsplashMetadataFromPhoto(photo)} className="truncate" />
                                    <ImagePicker
                                        selected={photo ? unsplashMetadataFromPhoto(photo) : null}
                                        onSelect={setPhoto}
                                        onClear={() => setPhoto(null)}
                                        triggerLabel={photo ? t('generator.changePhoto') : t('generator.choosePhoto')}
                                        className="h-7 px-2 text-[10px] font-bold uppercase tracking-wider"
                                    />
                                </div>
                            </div>
                        ) : (
                            <ImagePicker
                                selected={photo ? unsplashMetadataFromPhoto(photo) : null}
                                onSelect={setPhoto}
                                onClear={() => setPhoto(null)}
                                triggerLabel={t('generator.choosePhoto')}
                                className="w-full justify-center"
                            />
                        )}
                    </div>

                    <Button
                        className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] group/btn overflow-hidden relative"
                        disabled={!prompt.trim() || isGenerating}
                        onClick={handleGenerate}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-shimmer" />
                        {isGenerating ? (
                            <Loader2 className="w-5 h-5 animate-spin me-3" />
                        ) : (
                            <RefreshCw className="w-5 h-5 me-3 group-hover/btn:rotate-180 transition-transform duration-500" />
                        )}
                        {isGenerating ? t('generator.rendering') : t('generator.breatheLife')}
                    </Button>
                </CardContent>
            </Card>

            {/* Right: Preview & Gallery */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl overflow-hidden min-h-[500px] flex flex-col">
                <CardHeader className="border-b border-border/50 bg-muted/20">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                <CardTitle className="text-xl font-bold tracking-tight">{t('generator.theRender')}</CardTitle>
                            </div>
                            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                {t('generator.renderDescription')}
                            </CardDescription>
                        </div>
                        {activeThumbnail?.imageUrl && (
                            <Button variant="outline" size="sm" className="h-8 rounded-lg border-border/50 bg-background/50 font-bold" asChild>
                                <a href={activeThumbnail.imageUrl} download target="_blank" rel="noopener noreferrer">
                                    <Download className="w-3.5 h-3.5 me-2" />
                                    {t('generator.fetchArtifact')}
                                </a>
                            </Button>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="flex-1 p-0 relative flex items-center justify-center bg-muted/10 group/preview">
                    {isGenerating ? (
                        <div className="flex flex-col items-center gap-6 animate-pulse text-center p-12">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                                <Loader2 className="w-16 h-16 text-primary animate-spin relative" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-xl font-black text-foreground tracking-tighter">{t('generator.neuralAssembly')}</p>
                                <p className="text-muted-foreground text-sm font-medium max-w-[240px]">
                                    {t('generator.neuralAssemblyDescription')}
                                </p>
                            </div>
                        </div>
                    ) : activeThumbnail ? (
                        <div className="w-full h-full p-6 animate-in zoom-in-95 duration-1000">
                            <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl ring-1 ring-border/50 group-hover/preview:ring-primary/50 transition-all duration-700">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={activeThumbnail.imageUrl}
                                    alt={activeThumbnail.prompt}
                                    className="w-full h-full object-cover transition-transform duration-[2s] group-hover/preview:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/preview:opacity-100 transition-opacity duration-500" />
                                <div className="absolute bottom-6 start-6 end-6 translate-y-4 group-hover/preview:translate-y-0 opacity-0 group-hover/preview:opacity-100 transition-all duration-500">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge className="bg-primary/20 text-primary border-primary/20 backdrop-blur-md uppercase text-[9px] font-black tracking-widest px-2 py-0.5">
                                            {t(`styles.${stylePreset}.label`)}
                                        </Badge>
                                    </div>
                                    <p className="text-white font-medium text-sm line-clamp-2 italic opacity-80">
                                        &quot;{prompt}&quot;
                                    </p>
                                </div>
                            </div>

                            {/* Recent History Preview */}
                            {thumbnails && thumbnails.length > 1 && (
                                <div className="mt-8 space-y-4">
                                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                                        {thumbnails.slice(1, 4).map((thumb) => (
                                            <div key={thumb.id} className="flex-shrink-0 w-32 aspect-video rounded-lg overflow-hidden border border-border/50 opacity-40 hover:opacity-100 hover:border-primary/50 transition-all cursor-pointer">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={thumb.imageUrl} className="w-full h-full object-cover" alt={thumb.prompt} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center p-12 max-w-sm animate-in fade-in zoom-in-95 duration-1000">
                            <div className="w-24 h-24 rounded-full bg-muted/50 border border-border/50 flex items-center justify-center mx-auto mb-8 shadow-inner">
                                <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
                            </div>
                            <h3 className="text-3xl font-black text-foreground mb-4">{t('generator.voidTitle')}</h3>
                            <p className="text-muted-foreground font-medium text-lg max-w-md mx-auto leading-relaxed">
                                {t('generator.voidDescription')}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
