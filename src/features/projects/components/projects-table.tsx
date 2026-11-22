import { useTranslations } from 'next-intl';
import Link from 'next/link';

import { useUrlLocale } from '@/i18n/locale';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatRelativeTime } from '@/lib/relative-time';
import type { Project } from '@/types';

import { ProjectActions } from './project-actions';
import { PlatformBadge, StatusBadge } from './project-badges';

export function ProjectsTable({ projects }: { projects: Project[] }) {
    const t = useTranslations('projects');
    const locale = useUrlLocale();
    return (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="min-w-[240px]">{t('view.tableHeaders.project')}</TableHead>
                        <TableHead>{t('view.tableHeaders.platform')}</TableHead>
                        <TableHead>{t('view.tableHeaders.status')}</TableHead>
                        <TableHead>{t('view.tableHeaders.updated')}</TableHead>
                        <TableHead className="w-12">
                            <span className="sr-only">{t('view.tableHeaders.actions')}</span>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {projects.map((project) => {
                        const updated = formatRelativeTime(project.updatedAt, locale);
                        return (
                            <TableRow key={project._id}>
                                <TableCell>
                                    <Link
                                        href={`/projects/${project._id}`}
                                        className="font-semibold hover:text-primary focus-visible:outline-none focus-visible:underline"
                                    >
                                        {project.title}
                                    </Link>
                                    <p className="line-clamp-1 text-xs text-muted-foreground">
                                        {project.description?.trim() || project.idea}
                                    </p>
                                </TableCell>
                                <TableCell>
                                    <PlatformBadge platform={project.platform} />
                                </TableCell>
                                <TableCell>
                                    <StatusBadge status={project.status} />
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                                    <time dateTime={project.updatedAt} title={updated.absolute}>
                                        {updated.relative}
                                    </time>
                                </TableCell>
                                <TableCell>
                                    <ProjectActions project={project} />
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
