'use client';

import { useParams, useRouter } from 'next/navigation';
import { useProject } from '@/features/projects/hooks/use-projects';
import { useProjectScripts, useGenerateScript } from '@/features/scripts/hooks/use-scripts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    ArrowLeft,
    Plus,
    Settings,
    FileText,
    Image as ImageIcon,
    Music,
    BarChart3,
    Search,
    Sparkles,
    Zap,
    Layout,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { ScriptEditor } from '@/features/scripts/components/script-editor';
import { ThumbnailGenerator } from '@/features/thumbnails/components/thumbnail-generator';
import { AudioGenerator } from '@/features/audio/components/audio-generator';
import { AnalyticsView } from '@/features/analytics/components/analytics-view';
import { SEOAnalyzer } from '@/features/seo/components/seo-analyzer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ProjectWorkspacePage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const { data: project, isLoading: isProjectLoading, error: projectError } = useProject(projectId);
    const { data: scripts, isLoading: isScriptsLoading } = useProjectScripts(projectId);
    const { mutate: generateScript, isPending: isCreatingScript } = useGenerateScript();

    if (projectError) {
        toast.error('Project not found');
        router.push('/dashboard/projects');
        return null;
    }

    const handleGenerateFirstScript = () => {
        generateScript(projectId);
    };

    const isLoading = isProjectLoading || isScriptsLoading;

    // We assume 1 script active for now in this MVP, 
    // but a project can technically have multiple script versions
    const activeScript = scripts && scripts.length > 0 ? scripts[0] : null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Workspace Header */}
            <div className="relative overflow-hidden glass border-border/50 rounded-3xl p-8 mb-8 shadow-premium">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                    <div className="space-y-3">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-all group"
                        >
                            <ArrowLeft className="w-3 h-3 mr-2 group-hover:-translate-x-1 transition-transform" />
                            Workspace
                        </Link>

                        <div className="flex flex-col gap-2">
                            {isLoading ? (
                                <Skeleton className="h-10 w-72 rounded-xl" />
                            ) : (
                                <div className="flex items-center gap-4 flex-wrap">
                                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
                                        {project?.title}
                                    </h1>
                                    <Badge variant="outline" className="h-7 px-4 bg-primary text-primary-foreground border-transparent uppercase font-bold text-[10px] tracking-widest shadow-glow">
                                        {project?.platform}
                                    </Badge>
                                </div>
                            )}

                            {isLoading ? (
                                <Skeleton className="h-5 w-96 mt-2 rounded-lg" />
                            ) : (
                                <p className="text-muted-foreground text-lg font-medium max-w-3xl line-clamp-1 opacity-80">
                                    {project?.idea}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="lg" className="h-12 rounded-2xl border-border/50 bg-muted/20 hover:bg-muted/40 font-bold transition-all group">
                            <Settings className="w-4 h-4 mr-2 group-hover:rotate-45 transition-transform" />
                            Settings
                        </Button>
                        <Button size="lg" className="h-12 rounded-2xl bg-primary text-primary-foreground font-bold hover:shadow-glow active:scale-[0.98] transition-all">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Workspace Area via Tabs */}
            <Tabs defaultValue="script" className="w-full">
                <div className="flex items-center justify-center sm:justify-start mb-8">
                    <TabsList className="glass h-14 p-1.5 border-border/50 rounded-2xl shadow-sm">
                        {[
                            { value: 'script', label: 'Script Canvas', icon: FileText },
                            { value: 'thumbnails', label: 'Visuals', icon: ImageIcon },
                            { value: 'audio', label: 'Audio', icon: Music },
                            { value: 'analytics', label: 'Insights', icon: BarChart3 },
                            { value: 'seo', label: 'Ranking', icon: Search }
                        ].map((tab) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="h-full px-6 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all font-bold text-xs uppercase tracking-wider gap-2"
                            >
                                <tab.icon className="w-4 h-4" />
                                <span className="hidden md:inline">{tab.label}</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <div className="animate-in fade-in zoom-in-95 duration-500">
                    <TabsContent value="script" className="focus-visible:ring-0">
                        {isLoading ? (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <Skeleton className="lg:col-span-2 h-[600px] rounded-3xl" />
                                <Skeleton className="h-[400px] rounded-3xl" />
                            </div>
                        ) : !activeScript ? (
                            <div className="flex flex-col items-center justify-center p-20 text-center glass border-dashed border-primary/20 rounded-[40px] shadow-premium min-h-[500px]">
                                <div className="w-24 h-24 bg-primary ring-8 ring-primary/10 rounded-[32px] flex items-center justify-center mb-10 shadow-glow animate-bounce-slow">
                                    <Zap className="w-12 h-12 text-primary-foreground fill-current" />
                                </div>
                                <h3 className="text-3xl font-extrabold text-foreground mb-4">The Canvas is Empty</h3>
                                <p className="text-muted-foreground mb-10 max-w-lg text-lg font-medium leading-relaxed">
                                    Your project idea is ready to become a script. Let our AI architect your first draft in seconds.
                                </p>
                                <Button
                                    onClick={handleGenerateFirstScript}
                                    disabled={isCreatingScript}
                                    size="lg"
                                    className="h-16 px-10 rounded-2xl bg-primary text-primary-foreground font-extrabold text-lg hover:shadow-glow active:scale-[0.98] transition-all group"
                                >
                                    {isCreatingScript ? (
                                        <>
                                            <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                                            Architecting...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
                                            Generate AI Masterpiece
                                        </>
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <div className="glass border-border/50 rounded-[40px] p-1 overflow-hidden shadow-premium">
                                <ScriptEditor scriptId={activeScript.id} />
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="thumbnails" className="focus-visible:ring-0">
                        <div className="glass border-border/50 rounded-[40px] p-8 shadow-premium">
                            <ThumbnailGenerator projectId={projectId} />
                        </div>
                    </TabsContent>

                    <TabsContent value="audio" className="focus-visible:ring-0">
                        <div className="glass border-border/50 rounded-[40px] p-8 shadow-premium">
                            <AudioGenerator projectId={projectId} />
                        </div>
                    </TabsContent>

                    <TabsContent value="analytics" className="focus-visible:ring-0">
                        <div className="glass border-border/50 rounded-[40px] p-8 shadow-premium">
                            <AnalyticsView projectId={projectId} />
                        </div>
                    </TabsContent>

                    <TabsContent value="seo" className="focus-visible:ring-0">
                        <div className="glass border-border/50 rounded-[40px] p-8 shadow-premium">
                            <SEOAnalyzer projectId={projectId} />
                        </div>
                    </TabsContent>
                </div>
            </Tabs>

        </div>
    );
}
