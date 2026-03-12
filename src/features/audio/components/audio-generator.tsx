'use client';

import { useState } from 'react';
import { useProjectAudio, useCreateAudioSuggestion, useGenerateAudio } from '../hooks/use-audio';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
    Music,
    Play,
    Wand2,
    RefreshCw,
    Volume2,
    AudioLines,
    Zap,
    Waves,
    Mic2,
    Flame,
    Sparkles,
    Loader2
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AudioMood } from '../types';
import { cn } from '@/lib/utils';

interface AudioGeneratorProps {
    projectId: string;
}

const MOODS = [
    { id: 'energetic', label: 'Energetic & Fast', icon: Zap, description: 'High tempo, impactful beats' },
    { id: 'suspenseful', label: 'Suspenseful Epic', icon: Flame, description: 'Deep bass, cinematic tension' },
    { id: 'chill', label: 'Lo-fi & Chill', icon: Waves, description: 'Relaxed vibes, atmospheric' },
    { id: 'educational', label: 'Educational', icon: Mic2, description: 'Clear, unobtrusive ambient' },
];

export const AudioGenerator = ({ projectId }: AudioGeneratorProps) => {
    const { data: audioProfiles, isLoading } = useProjectAudio(projectId);
    const { mutate: generateAudio, isPending: isGenerating } = useGenerateAudio();

    const [mood, setMood] = useState<AudioMood>('energetic');

    const handleGenerate = () => {
        generateAudio({ projectId });
    };

    const activeAudio = audioProfiles && audioProfiles.length > 0 ? audioProfiles[0] : null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Settings Area */}
            <Card className="lg:col-span-1 glass border-border/50 rounded-[32px] shadow-premium h-full flex flex-col overflow-hidden">
                <CardHeader className="bg-muted/30 pb-6 border-b border-border/50">
                    <CardTitle className="flex items-center gap-3 text-xl font-bold">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Volume2 className="w-5 h-5" />
                        </div>
                        Sonic Architecture
                    </CardTitle>
                    <CardDescription className="font-medium">Define the core frequency of your project</CardDescription>
                </CardHeader>

                <CardContent className="flex-1 p-8 space-y-8 overflow-y-auto">
                    <div className="space-y-4">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                            Select Vibration
                        </Label>
                        <RadioGroup
                            value={mood}
                            onValueChange={(val) => setMood(val as AudioMood)}
                            className="grid grid-cols-1 gap-4"
                        >
                            {MOODS.map((m) => (
                                <div
                                    key={m.id}
                                    className={cn(
                                        "flex items-start space-x-4 border rounded-[20px] p-4 cursor-pointer transition-all duration-300 group",
                                        mood === m.id
                                            ? "border-primary bg-primary/5 shadow-glow"
                                            : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                                    )}
                                    onClick={() => setMood(m.id as AudioMood)}
                                >
                                    <div className={cn(
                                        "p-2.5 rounded-xl shrink-0 transition-colors",
                                        mood === m.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-primary"
                                    )}>
                                        <m.icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <Label htmlFor={`mood-${m.id}`} className="cursor-pointer font-bold text-sm block">
                                            {m.label}
                                        </Label>
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                            {m.description}
                                        </p>
                                    </div>
                                    <RadioGroupItem value={m.id} id={`mood-${m.id}`} className="sr-only" />
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    <div className="pt-4">
                        <Button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="w-full bg-primary text-primary-foreground h-14 rounded-2xl font-bold text-lg shadow-glow transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isGenerating ? (
                                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                            ) : (
                                <Sparkles className="w-6 h-6 mr-3" />
                            )}
                            {isGenerating ? 'Synthesizing...' : 'Generate Profile'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Suggested Tracks Area */}
            <Card className="lg:col-span-2 glass border-border/50 rounded-[32px] shadow-premium h-full flex flex-col overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between bg-muted/30 pb-6 border-b border-border/50 px-8">
                    <div>
                        <CardTitle className="flex items-center gap-3 text-xl font-bold">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <AudioLines className="w-5 h-5" />
                            </div>
                            Curated Mastertracks
                        </CardTitle>
                        <CardDescription className="font-medium">AI-driven soundtrack selection based on script tempo</CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 p-8 flex flex-col justify-start min-h-[500px] relative">
                    {isLoading ? (
                        <div className="space-y-6">
                            <Skeleton className="w-full h-24 rounded-3xl" />
                            <Skeleton className="w-full h-24 rounded-3xl" />
                            <Skeleton className="w-full h-24 rounded-3xl" />
                        </div>
                    ) : isGenerating ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center relative overflow-hidden h-full rounded-[40px] border border-primary/20 bg-primary/5 shadow-inner-glow">
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent animate-pulse" />
                            <div className="relative z-10">
                                <Music className="w-20 h-20 text-primary animate-bounce mb-8 filter drop-shadow-glow" />
                                <h3 className="text-3xl font-black text-foreground mb-4">Deep Frequency Scan</h3>
                                <p className="text-muted-foreground font-medium max-w-sm text-lg mx-auto">
                                    Our neural engine is analyzing your script's cadence to match the perfect audio landscape.
                                </p>
                            </div>
                        </div>
                    ) : activeAudio && activeAudio.status === 'completed' ? (
                        <div className="space-y-10">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Premier Suggestions</h4>
                                    <Badge variant="outline" className="border-primary/30 text-primary font-mono bg-primary/5 uppercase tracking-tighter">
                                        Lossless HQ
                                    </Badge>
                                </div>
                                {activeAudio.tracks && activeAudio.tracks.length > 0 ? (
                                    <div className="space-y-4">
                                        {activeAudio.tracks.map((track, i) => (
                                            <div key={i} className="group relative flex items-center justify-between p-5 rounded-3xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-all duration-300 hover:shadow-premium">
                                                <div className="flex items-center gap-5">
                                                    <Button
                                                        variant="secondary"
                                                        size="icon"
                                                        className="rounded-2xl bg-primary text-primary-foreground shadow-glow w-12 h-12 shrink-0 group-hover:scale-110 transition-transform active:scale-90"
                                                    >
                                                        <Play className="w-5 h-5 translate-x-0.5 fill-current" />
                                                    </Button>
                                                    <div className="space-y-1">
                                                        <p className="font-extrabold text-foreground text-base tracking-tight">{track.title}</p>
                                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{track.genre} <span className="mx-2 opacity-30">•</span> {track.bpm} BPM</p>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-2">
                                                    <p className="text-sm font-black font-mono text-foreground opacity-80">{track.duration}</p>
                                                    <Badge className="bg-background/80 backdrop-blur-sm text-[10px] font-bold border-border/50 rounded-lg text-primary">
                                                        {track.mood.toUpperCase()}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm italic">Synchronizing with cloud library...</p>
                                )}
                            </div>

                            <div className="pt-8 border-t border-border/50">
                                <div className="flex items-center justify-between mb-8">
                                    <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
                                        Foley & Sonic FX
                                    </h4>
                                    <Badge variant="secondary" className="bg-primary/10 text-primary font-bold shadow-glow-sm">
                                        {activeAudio.analysisConfidence}% NEURAL MATCH
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {activeAudio.sfxSuggestions && activeAudio.sfxSuggestions.length > 0 ? (
                                        activeAudio.sfxSuggestions.map((sfx, idx) => (
                                            <div key={idx} className="p-5 rounded-2xl glass border-border/50 hover:border-primary/30 transition-all group">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-sm font-extrabold text-foreground">{sfx.name}</p>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 group-hover:text-primary transition-colors">{sfx.category}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground font-medium leading-relaxed italic">{sfx.description}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-muted-foreground text-sm italic col-span-2 text-center py-8">Wait for project analysis...</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-20 text-center glass border-dashed border-primary/20 rounded-[40px] min-h-[400px]">
                            <div className="w-24 h-24 bg-muted/30 rounded-[32px] flex items-center justify-center mb-10 group-hover:bg-primary/10 transition-colors">
                                <Music className="w-12 h-12 text-muted-foreground/30" />
                            </div>
                            <h3 className="text-3xl font-black text-foreground mb-4">Sonic Void</h3>
                            <p className="text-muted-foreground font-medium text-lg max-w-md mx-auto leading-relaxed">
                                Select an emotional frequency from the architect panel to generate your project's sonic profile.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
