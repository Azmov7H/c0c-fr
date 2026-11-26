import { useTranslations } from 'next-intl';
import Link from 'next/link';

import { useUrlLocale } from '@/i18n/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRelativeTime } from '@/lib/relative-time';
import type { Project } from '@/types';

import { platformLabel } from '../lib/projects-labels';
import { ProjectActions } from './project-actions';
import { PlatformBadge, StatusBadge } from './project-badges';

function ProjectThumbnail({ project }: { project: Project }) {
    const t = useTranslations('projects');
    const sameOrigin = project.thumbnailUrl?.startsWith('/');

    return (
        <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-primary/15 via-muted to-accent/10">
            {sameOrigin ? (
                // eslint-disable-next-line @next/next/no-img-element -- CSP permits same-origin only; uploads are proxied by the BFF.
                <img
                    src={project.thumbnailUrl}
                    alt={t('card.thumbnailAlt', { title: project.title })}
                    className="size-full object-cover"
                    loading="lazy"
                />
            ) : (
                <div className="flex size-full items-center justify-center">
                    <span className="font-display text-4xl font-black uppercase text-primary/30">
                        {project.title.trim().charAt(0) || 'P'}
                    </span>
                </div>
            )}
            <div className="absolute start-3 top-3">
                <PlatformBadge platform={project.platform} />
            </div>
        </div>
    );
}

export function ProjectCard({ project }: { project: Project }) {
    const t = useTranslations('projects');
    const locale = useUrlLocale();
    const updated = formatRelativeTime(project.updatedAt, locale);
    const excerpt = project.description?.trim() || project.idea;
    const initial = project.title.trim().charAt(0) || 'P';
    const platform = platformLabel(t, project.platform);

    return (
        <Card
            data-project-card
            className="group flex h-full flex-col overflow-hidden border-border/50 transition-all duration-200 hover:border-primary/40 hover:shadow-premium"
        >
            <Link
                href={`/projects/${project._id}`}
                className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label={`${t('card.openLabel', { title: project.title })} — ${initial}${platform}`}
            >
                <ProjectThumbnail project={project} />
            </Link>

            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2 pt-4">
                <div className="min-w-0 space-y-1">
                    <CardTitle className="text-base leading-tight">
                        <Link
                            href={`/projects/${project._id}`}
                            className="line-clamp-1 transition-colors hover:text-primary focus-visible:outline-none focus-visible:underline"
                        >
                            {project.title}
                        </Link>
                    </CardTitle>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{excerpt}</p>
                </div>
                <ProjectActions project={project} />
            </CardHeader>

            <CardContent className="mt-auto flex items-center justify-between gap-2 pt-2">
                <StatusBadge status={project.status} />
                <span className="text-xs text-muted-foreground">
                    <span className="sr-only">
                        {t('card.platformSr', { label: platformLabel(t, project.platform) })}
                    </span>
                    <time dateTime={project.updatedAt} title={updated.absolute}>
                        {updated.relative}
                    </time>
                </span>
            </CardContent>
        </Card>
    );
}
