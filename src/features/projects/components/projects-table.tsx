import Link from 'next/link';

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
    return (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="min-w-[240px]">Project</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead className="w-12">
                            <span className="sr-only">Actions</span>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {projects.map((project) => {
                        const updated = formatRelativeTime(project.updatedAt);
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
