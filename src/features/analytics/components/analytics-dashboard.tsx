'use client';

import { useUrlLocale } from '@/i18n/locale';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { AlertTriangle, CalendarDays, FileText, Image as ImageIcon, Music, FolderKanban } from 'lucide-react';

import { DirIcon } from '@/components/icons/dir-icon';
import { DataState } from '@/components/shared/data-state';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardStats } from '@/features/dashboard/hooks/use-dashboard';
import { formatNumber, formatRelativeTime } from '@/features/dashboard/lib/format';

export function AnalyticsDashboard() {
    const t = useTranslations('analytics');
    const locale = useUrlLocale();
    const stats = useDashboardStats();
    const data = stats.data;
    const totalProjects = data?.overview.totalProjects ?? 0;

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('page.title')}
                description={t('page.description')}
            />

            <DataState
                isLoading={stats.isLoading}
                error={stats.isError ? new Error(t('error.loadFailed')) : null}
                isEmpty={totalProjects === 0}
                emptyTitle={t('empty.title')}
                emptyDescription={t('empty.description')}
                emptyIcon={CalendarDays}
                onRetry={() => void stats.refetch()}
                loadingFallback={
                    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                        {[
                            t('metrics.projects'),
                            t('metrics.scripts'),
                            t('metrics.thumbnails'),
                            t('metrics.mediaAudio'),
                        ].map((label) => (
                            <div key={label} className="rounded-xl border border-border/50 p-5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                                <div className="mt-3 h-8 w-20 animate-pulse rounded bg-muted" />
                            </div>
                        ))}
                    </div>
                }
            >
                {data && totalProjects > 0 && (
                    <>
                        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                            <Metric label={t('metrics.projects')} value={data.overview.totalProjects} icon={FolderKanban} sub={t('metrics.projectsSub', { count: data.overview.completedProjects })} locale={locale} />
                            <Metric label={t('metrics.scripts')} value={data.overview.totalScripts} icon={FileText} sub={t('metrics.scriptsSub', { count: data.overview.activeProjects })} locale={locale} />
                            <Metric label={t('metrics.thumbnails')} value={data.overview.totalThumbnails} icon={ImageIcon} sub={t('metrics.thumbnailsSub', { count: data.overview.draftProjects })} locale={locale} />
                            <Metric label={t('metrics.mediaAudio')} value={data.overview.totalMediaItems + data.overview.totalAudioSuggestions} icon={Music} sub={t('metrics.mediaAudioSub', { count: data.overview.archivedProjects })} locale={locale} />
                        </div>

                        <Card className="border-border/50">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
                                <div>
                                    <CardTitle className="text-base font-bold">{t('activity.title')}</CardTitle>
                                    <p className="text-xs text-muted-foreground mt-0.5">{t('activity.description')}</p>
                                </div>
                                <Badge variant="outline">{t('activity.measured')}</Badge>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div dir="ltr" role="table" aria-label={t('activity.aria')} className="space-y-2">
                                    {data.weeklyActivity.map((row) => {
                                        const total = row.projects + row.scripts;
                                        return (
                                            <div key={row.day} role="row" className="flex items-center gap-3">
                                                <span className="w-10 text-xs font-semibold">{row.day}</span>
                                                <div className="h-3 flex-1 overflow-hidden rounded bg-muted" aria-hidden="true">
                                                    <div className="h-full rounded bg-primary" style={{ width: `${Math.min(100, total * 20)}%` }} />
                                                </div>
                                                <span className="w-8 text-right text-xs tabular-nums">{total}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid gap-6 lg:grid-cols-2">
                            <Card className="border-border/50">
                                <CardHeader className="border-b border-border/50 pb-4">
                                    <CardTitle className="text-base font-bold">{t('completion.title')}</CardTitle>
                                    <p className="text-xs text-muted-foreground mt-0.5">{t('completion.description')}</p>
                                </CardHeader>
                                <CardContent className="space-y-2 pt-4">
                                    {[
                                        [t('completion.draft'), data.overview.draftProjects],
                                        [t('completion.inProgress'), data.overview.activeProjects],
                                        [t('completion.completed'), data.overview.completedProjects],
                                        [t('completion.archived'), data.overview.archivedProjects],
                                    ].map(([label, value]) => (
                                        <div key={label as string} className="flex items-center justify-between text-sm">
                                            <span>{label}</span>
                                            <span className="tabular-nums font-semibold">{value as number}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card className="border-border/50">
                                <CardHeader className="border-b border-border/50 pb-4">
                                    <CardTitle className="text-base font-bold">{t('platforms.title')}</CardTitle>
                                    <p className="text-xs text-muted-foreground mt-0.5">{t('platforms.description')}</p>
                                </CardHeader>
                                <CardContent className="space-y-2 pt-4">
                                    {[
                                        [t('platforms.youtube'), data.projectsByPlatform.youtube],
                                        [t('platforms.tiktok'), data.projectsByPlatform.tiktok],
                                        [t('platforms.instagram'), data.projectsByPlatform.instagram],
                                        [t('platforms.facebook'), data.projectsByPlatform.facebook],
                                    ].map(([label, value]) => (
                                        <div key={label as string} className="flex items-center justify-between text-sm">
                                            <span>{label}</span>
                                            <span className="tabular-nums font-semibold">{value as number}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>

                        {data.recentProjects.length > 0 && (
                            <Card className="border-border/50">
                                <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
                                    <CardTitle className="text-base font-bold">{t('recent.title')}</CardTitle>
                                    <Button asChild variant="ghost" size="sm" className="h-8">
                                        <Link href="/projects">{t('recent.allProjects')}{' '}<DirIcon name="ArrowRight" className="ms-1 h-3.5 w-3.5" aria-hidden="true" /></Link>
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-2 pt-4">
                                    {data.recentProjects.map((project) => (
                                        <div key={project._id} className="flex items-center justify-between p-2 text-sm">
                                            <span className="min-w-0 truncate font-semibold">{project.title}</span>
                                            <span className="text-xs text-muted-foreground">{formatRelativeTime(project.updatedAt ?? project.createdAt, locale).relative}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </DataState>

            <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {t('disclaimer', { projection: t('disclaimerProjection') })}
            </p>
        </div>
    );
}

function Metric({ label, value, sub, icon: Icon, locale }: { label: string; value: number; sub: string; icon: React.ElementType; locale: string }) {
    return (
        <Card className="border-border/50">
            <CardContent className="p-5">
                <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                </div>
                <p className="mt-2 text-3xl font-black tracking-tight tabular-nums">{formatNumber(value, locale as "en" | "ar")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
            </CardContent>
        </Card>
    );
}
