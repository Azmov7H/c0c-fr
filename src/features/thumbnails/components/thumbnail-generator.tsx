'use client';

import { useState } from 'react';
import { useProjectThumbnails, useCreateThumbnail } from '../hooks/use-thumbnails';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
    Image as ImageIcon,
    Wand2,
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

interface ThumbnailGeneratorProps {
    projectId: string;
}

const STYLES = [
    { id: '3d-render', label: '3D Render', icon: Box, description: 'Soft shadows, clay-like depth' },
    { id: 'cinematic', label: 'Cinematic', icon: Film, description: 'High contrast, dramatic lighting' },
    { id: 'minimalist', label: 'Minimalist', icon: Minimize2, description: 'Flat vector, clean lines' },
];

export const ThumbnailGenerator = ({ projectId }: ThumbnailGeneratorProps) => {
    const { data: thumbnails, isLoading } = useProjectThumbnails(projectId);
    const { mutate: generateThumbnail, isPending: isGenerating } = useCreateThumbnail();

    const [prompt, setPrompt] = useState('');
    const [stylePreset, setStylePreset] = useState<ThumbnailStyle>('3d-render');

    const handleGenerate = () => {
        if (!prompt.trim()) return;

        generateThumbnail({
            projectId,
            prompt,
            stylePreset,
        });
    };

    const activeThumbnail = thumbnails && thumbnails.length > 0 ? thumbnails[0] : null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Settings & Prompt Area */}
            <Card className="lg:col-span-1 glass border-border/50 rounded-[32px] shadow-premium h-full flex flex-col overflow-hidden">
                <CardHeader className="bg-muted/30 pb-6 border-b border-border/50">
                    <CardTitle className="flex items-center gap-3 text-xl font-bold">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Palette className="w-5 h-5" />
                        </div>
                        Visual Core
                    </CardTitle>
                    <CardDescription className="font-medium">Direct the AI vision for your masterpiece</CardDescription>
                </CardHeader>

                <CardContent className="flex-1 p-8 space-y-8 overflow-y-auto">
                    {/* Prompt */}
                    <div className="space-y-4">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">The Directive</Label>
                        <div className="relative group">
                            <Textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="A cybernetic detective in a neon-lit alleyway, hyper-detailed, synthwave color palette..."
                                className="min-h-[160px] glass bg-muted/20 border-border/50 rounded-2xl resize-none focus-visible:ring-primary/30 p-5 text-sm font-medium leading-relaxed group-hover:border-primary/20 transition-all"
                            />
                            <div className="absolute bottom-4 right-4 text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">
                                {prompt.length} chars
                            </div>
                        </div>
                    </div>

                    {/* Style Selector */}
                    <div className="space-y-4">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Visual Frequency</Label>
                        <RadioGroup
                            value={stylePreset}
                            onValueChange={(val) => setStylePreset(val as ThumbnailStyle)}
                            className="grid grid-cols-1 gap-4"
                        >
                            {STYLES.map((style) => (
                                <div
                                    key={style.id}
                                    className={cn(
                                        "flex items-center space-x-4 border rounded-[20px] p-4 cursor-pointer transition-all duration-300 group",
                                        stylePreset === style.id
                                            ? "border-primary bg-primary/5 shadow-glow scale-[1.02]"
                                            : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                                    )}
                                    onClick={() => setStylePreset(style.id as ThumbnailStyle)}
                                >
                                    <div className={cn(
                                        "p-2.5 rounded-xl shrink-0 transition-colors",
                                        stylePreset === style.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-primary"
                                    )}>
                                        <style.icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <Label htmlFor={`style-${style.id}`} className="cursor-pointer font-bold text-sm block">
                                            {style.label}
                                        </Label>
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                            {style.description}
                                        </p>
                                    </div>
                                    <RadioGroupItem value={style.id} id={`style-${style.id}`} className="sr-only" />
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    <div className="pt-4">
                        <Button
                            onClick={handleGenerate}
                            disabled={isGenerating || !prompt.trim()}
                            className="w-full bg-primary text-primary-foreground h-14 rounded-2xl font-bold text-lg shadow-glow transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isGenerating ? (
                                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                            ) : (
                                <Sparkles className="w-6 h-6 mr-3" />
                            )}
                            {isGenerating ? 'Rendering...' : 'Breathe Life'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Preview Area */}
            <Card className="lg:col-span-2 glass border-border/50 rounded-[32px] shadow-premium h-full flex flex-col overflow-hidden group/preview">
                <CardHeader className="flex flex-row items-center justify-between bg-muted/30 pb-6 border-b border-border/50 px-8">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-3 text-xl font-bold">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <ImageIcon className="w-5 h-5" />
                            </div>
                            The Render
                        </CardTitle>
                        <CardDescription className="font-medium text-[10px] uppercase tracking-widest opacity-70">Resolution: 3840 x 2160 (Lossless)</CardDescription>
                    </div>
                    {activeThumbnail && activeThumbnail.status === 'completed' && activeThumbnail.imageUrl && (
                        <Button variant="outline" size="sm" className="hidden sm:flex h-10 rounded-xl border-border/50 bg-background/50 font-bold text-xs uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all">
                            <Download className="w-4 h-4 mr-2" />
                            Fetch Artifact
                        </Button>
                    )}
                </CardHeader>

                <CardContent className="flex-1 p-8 flex items-center justify-center min-h-[500px] relative">
                    {isLoading ? (
                        <div className="w-full aspect-video rounded-[32px] overflow-hidden">
                            <Skeleton className="w-full h-full" />
                        </div>
                    ) : isGenerating || (activeThumbnail?.status === 'generating') ? (
                        <div className="w-full aspect-video rounded-[40px] border border-primary/20 bg-primary/5 flex flex-col items-center justify-center text-center p-12 relative overflow-hidden shadow-inner-glow">
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-purple-500/10 animate-pulse opacity-50" />
                            <div className="relative z-10">
                                <RefreshCw className="w-20 h-20 text-primary animate-spin-slow mb-8 filter drop-shadow-glow" />
                                <h3 className="text-3xl font-black text-foreground mb-4">Neural Assembly</h3>
                                <p className="text-muted-foreground font-medium max-w-sm text-lg mx-auto">
                                    Our visual processing units are weaving your directive into reality. Perfection takes a moment.
                                </p>
                            </div>
                        </div>
                    ) : activeThumbnail && activeThumbnail.imageUrl ? (
                        <div className="w-full relative rounded-[40px] overflow-hidden shadow-2xl-premium group/image">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={activeThumbnail.imageUrl}
                                alt={activeThumbnail.prompt}
                                className="w-full h-auto aspect-video object-cover transition-transform duration-1000 group-hover/image:scale-[1.05]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-10">
                                <div className="space-y-3 translate-y-4 group-hover/image:translate-y-0 transition-transform duration-500">
                                    <Badge className="bg-primary shadow-glow text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl">
                                        {activeThumbnail.stylePreset.replace('-', ' ')}
                                    </Badge>
                                    <p className="text-white font-medium text-lg line-clamp-2 italic leading-relaxed opacity-80">
                                        "{activeThumbnail.prompt}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-20 text-center glass border-dashed border-primary/20 rounded-[40px] w-full aspect-video shadow-inner">
                            <div className="w-24 h-24 bg-muted/30 rounded-[32px] flex items-center justify-center mb-10 group-focus-within/preview:bg-primary/10 transition-colors">
                                <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
                            </div>
                            <h3 className="text-3xl font-black text-foreground mb-4">The Void Awaits</h3>
                            <p className="text-muted-foreground font-medium text-lg max-w-md mx-auto leading-relaxed">
                                Inject a visual directive in the architect panel to materialize your project's identity.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
