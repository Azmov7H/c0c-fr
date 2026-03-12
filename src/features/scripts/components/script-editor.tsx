'use client';

import { useState, useEffect } from 'react';
import { useScript, useUpdateScript, useGenerateScript } from '../hooks/use-scripts';
import { Script } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Save,
    FileText,
    Activity,
    Clock,
    BarChart3,
    Wand2,
    Sparkles,
    Zap,
    Type,
    BrainCircuit,
    Hash
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ScriptEditorProps {
    scriptId: string;
}

export const ScriptEditor = ({ scriptId }: ScriptEditorProps) => {
    const { data: script, isLoading } = useScript(scriptId);
    const { mutate: updateScript, isPending: isUpdating } = useUpdateScript();
    const { mutate: generateScript, isPending: isGenerating } = useGenerateScript();

    const [content, setContent] = useState('');
    const [isDirty, setIsDirty] = useState(false);

    // Sync initial content or when script changes
    useEffect(() => {
        if (script && script.sections && script.sections.length > 0) {
            setContent(script.sections[0]?.content || '');
            setIsDirty(false);
        }
    }, [script]);

    const handleSave = () => {
        if (!script) return;

        updateScript({
            id: scriptId,
            data: {
                projectId: script.projectId,
                sections: [
                    {
                        order: 0,
                        label: 'Main Content',
                        content: content
                    }
                ],
                wordCount: content.split(/\s+/).filter(w => w.length > 0).length,
                status: 'draft'
            }
        });
        setIsDirty(false);
    };

    if (isLoading || !script) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full min-h-[600px] animate-in fade-in duration-500">
                <div className="lg:col-span-2">
                    <Skeleton className="w-full h-full rounded-[32px]" />
                </div>
                <div className="space-y-6">
                    <Skeleton className="w-full h-64 rounded-[32px]" />
                    <Skeleton className="w-full h-48 rounded-[32px]" />
                </div>
            </div>
        );
    }

    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    const readTimeMins = Math.max(1, Math.ceil(wordCount / 150));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Editor Main Area */}
            <Card className="lg:col-span-2 relative overflow-hidden glass border-border/50 rounded-[32px] shadow-premium h-full flex flex-col group/editor">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-focus-within/editor:opacity-100 transition-opacity duration-700" />

                <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 px-8 py-6">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <FileText className="w-5 h-5" />
                            </div>
                            Script Canvas
                        </CardTitle>
                        <CardDescription className="font-medium opacity-70">Architect your video narrative with precision</CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="lg"
                            className="hidden sm:flex h-11 rounded-xl border-primary/20 bg-primary/5 text-primary font-bold hover:bg-primary/10 hover:shadow-glow transition-all"
                            disabled={isGenerating}
                            onClick={() => generateScript(script.projectId)}
                        >
                            <Sparkles className={cn("w-4 h-4 mr-2", isGenerating && "animate-spin")} />
                            {isGenerating ? 'AI Thinking...' : 'Refine with AI'}
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={!isDirty || isUpdating}
                            size="lg"
                            className="h-11 rounded-xl bg-primary text-primary-foreground font-bold hover:shadow-glow active:scale-[0.98] transition-all"
                        >
                            {isUpdating ? <Zap className="w-4 h-4 mr-2 animate-pulse" /> : <Save className="w-4 h-4 mr-2" />}
                            {isUpdating ? 'Saving...' : 'Sync Draft'}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 min-h-[600px] relative">
                    <Textarea
                        value={content}
                        onChange={(e) => {
                            setContent(e.target.value);
                            setIsDirty(true);
                        }}
                        placeholder="Once upon a time in the digital age..."
                        className="w-full h-full min-h-[600px] border-0 focus-visible:ring-0 rounded-none resize-none p-10 text-lg font-medium leading-[1.8] bg-transparent selection:bg-primary/20 placeholder:text-muted-foreground/30"
                    />

                    {/* Character/Focus indicator */}
                    <div className="absolute bottom-6 right-8 opacity-40 group-focus-within/editor:opacity-100 transition-opacity">
                        <Badge variant="outline" className="bg-background/50 border-border/50 font-mono text-[10px] uppercase tracking-widest px-3 h-6">
                            Editing Node: Main Content
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Insights Sidebar */}
            <div className="space-y-6">
                <Card className="glass border-border/50 rounded-[32px] shadow-premium overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
                        <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2 text-muted-foreground">
                            <BrainCircuit className="w-3.5 h-3.5 text-primary" />
                            Intelligence
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2 p-4 glass border-border/50 rounded-2xl relative overflow-hidden group/metric">
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/metric:opacity-30 transition-opacity">
                                    <Type className="w-8 h-8" />
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Words</p>
                                <p className="text-3xl font-black font-mono text-foreground leading-none">{wordCount}</p>
                            </div>
                            <div className="space-y-2 p-4 glass border-border/50 rounded-2xl relative overflow-hidden group/metric">
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/metric:opacity-30 transition-opacity">
                                    <Clock className="w-8 h-8" />
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Min</p>
                                <p className="text-3xl font-black font-mono text-foreground leading-none">
                                    {readTimeMins}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-border/50">
                            {[
                                { label: 'Reading level', value: script.readingLevel || 'Grade 8', icon: BarChart3 },
                                { label: 'Tone analysis', value: script.sentiment || 'Professional', icon: Activity },
                                { label: 'Project Status', value: script.status, icon: Zap, highlight: true }
                            ].map((stat, i) => (
                                <div key={i} className="flex justify-between items-center group/item p-1">
                                    <div className="flex items-center gap-3">
                                        <stat.icon className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span className="text-xs font-bold uppercase tracking-tight text-muted-foreground/80">{stat.label}</span>
                                    </div>
                                    <Badge
                                        variant={stat.highlight ? "default" : "outline"}
                                        className={cn(
                                            "h-7 px-3 rounded-lg uppercase text-[10px] font-bold tracking-widest transition-all",
                                            stat.highlight ? "bg-primary shadow-glow hover:bg-primary/90" : "bg-muted/30 border-border/30 group-hover/item:border-primary/30"
                                        )}
                                    >
                                        {stat.value}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass border-border/50 rounded-[32px] shadow-premium overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
                        <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2 text-muted-foreground">
                            <Hash className="w-3.5 h-3.5 text-primary" />
                            Viral Connect
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="flex flex-wrap gap-2">
                            {['#impact', '#viral_ops', '#content_engine', '#ai_driven'].map(tag => (
                                <Badge
                                    key={tag}
                                    className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-primary-foreground font-bold text-[10px] transition-all cursor-pointer"
                                >
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                        <p className="mt-6 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest leading-loose">
                            AI-generated tags based on script semantic analysis
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
