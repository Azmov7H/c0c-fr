'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight, CalendarDays, FileText, Image as ImageIcon, Music, FolderKanban } from 'lucide-react';

import { DataState } from '@/components/shared/data-state';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardStats } from '@/features/dashboard/hooks/use-dashboard';
import { formatNumber, formatRelativeTime } from '@/features/dashboard/lib/format';

/**
 * P01 — measured analytics only. The previous page rendered hardcoded
 * views/engagement/demographics with no backend behind it. Everything
 * below is a real count from `/dashboard/stats`, labelled measured;
 * generation activity is creation activity, never "views".
 */
export function AnalyticsDashboard() {
  const stats = useDashboardStats();
  const data = stats.data;
  const totalProjects = data?.overview.totalProjects ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Measured creation activity across your projects. Projections are always labelled."
      />

      <DataState
        isLoading={stats.isLoading}
        error={stats.isError ? new Error('Analytics could not be loaded.') : null}
        isEmpty={totalProjects === 0}
        emptyTitle="No generation activity yet"
        emptyDescription="Create your first project — analytics appear once you start generating."
        emptyIcon={CalendarDays}
        onRetry={() => void stats.refetch()}
        loadingFallback={
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {['Projects', 'Scripts', 'Thumbnails', 'Media & audio'].map((label) => (
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
              <Metric label="Projects" value={data.overview.totalProjects} icon={FolderKanban} sub={`${data.overview.completedProjects} completed`} />
              <Metric label="Scripts" value={data.overview.totalScripts} icon={FileText} sub={`${data.overview.activeProjects} in progress`} />
              <Metric label="Thumbnails" value={data.overview.totalThumbnails} icon={ImageIcon} sub={`${data.overview.draftProjects} drafts`} />
              <Metric label="Media & audio" value={data.overview.totalMediaItems + data.overview.totalAudioSuggestions} icon={Music} sub={`${data.overview.archivedProjects} archived · by platform below`} />
            </div>

            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
                <div>
                  <CardTitle className="text-base font-bold">Creation activity (last 7 days)</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Projects + scripts created per day — measured, not views</p>
                </div>
                <Badge variant="outline">Measured</Badge>
              </CardHeader>
              <CardContent className="p-4">
                <div role="table" aria-label="Creation activity by day" className="space-y-2">
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
                  <CardTitle className="text-base font-bold">Project completion</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Measured counts by status</p>
                </CardHeader>
                <CardContent className="space-y-2 pt-4">
                  {[
                    ['Draft', data.overview.draftProjects],
                    ['In progress', data.overview.activeProjects],
                    ['Completed', data.overview.completedProjects],
                    ['Archived', data.overview.archivedProjects],
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
                  <CardTitle className="text-base font-bold">Projects by platform</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Measured project counts</p>
                </CardHeader>
                <CardContent className="space-y-2 pt-4">
                  {[
                    ['YouTube', data.projectsByPlatform.youtube],
                    ['TikTok', data.projectsByPlatform.tiktok],
                    ['Instagram', data.projectsByPlatform.instagram],
                    ['Facebook', data.projectsByPlatform.facebook],
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
                  <CardTitle className="text-base font-bold">Recent projects</CardTitle>
                  <Button asChild variant="ghost" size="sm" className="h-8">
                    <Link href="/projects">All projects <ArrowRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" /></Link>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2 pt-4">
                  {data.recentProjects.map((project) => (
                    <div key={project._id} className="flex items-center justify-between p-2 text-sm">
                      <span className="min-w-0 truncate font-semibold">{project.title}</span>
                      <span className="text-xs text-muted-foreground">{formatRelativeTime(project.updatedAt ?? project.createdAt).relative}</span>
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
        Views, watch time, and predicted performance are not measured by C0C and are never shown as real data.
        Per-project AI reports, when generated, carry a <span className="font-semibold">projection</span> label.
      </p>
    </div>
  );
}

function Metric({ label, value, sub, icon: Icon }: { label: string; value: number; sub: string; icon: React.ElementType }) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
          <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        </div>
        <p className="mt-2 text-3xl font-black tracking-tight tabular-nums">{formatNumber(value)}</p>
        <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}
