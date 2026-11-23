'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Archive, ExternalLink, MoreVertical, RotateCcw, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Project, ProjectStatus } from '@/types';

import { useDeleteProject, useUpdateProject } from '../hooks/use-projects';
import { statusLabel } from '../lib/projects-labels';
import { DeleteProjectDialog } from './delete-project-dialog';

const STATUS_CHOICES: ProjectStatus[] = ['draft', 'processing', 'completed'];

export function ProjectActions({ project }: { project: Project }) {
    const t = useTranslations('projects');
    const router = useRouter();
    const [deleteOpen, setDeleteOpen] = useState(false);
    const update = useUpdateProject();
    const remove = useDeleteProject();

    const changeStatus = (status: ProjectStatus) => {
        if (status === project.status) return;
        update.mutate({
            id: project._id,
            data: { status },
            successMessage: t('actions.statusMarked', {
                status: statusLabel(t, status).toLowerCase(),
            }),
        });
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 shrink-0 text-muted-foreground max-md:size-11"
                        aria-label={t('actions.triggerAria', { title: project.title })}
                    >
                        <MoreVertical className="size-4" aria-hidden="true" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="truncate">{project.title}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => router.push(`/projects/${project._id}`)}>
                        <ExternalLink className="size-4" aria-hidden="true" />
                        {t('actions.openProject')}
                    </DropdownMenuItem>

                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <RotateCcw className="size-4" aria-hidden="true" />
                            {t('actions.changeStatus')}
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuRadioGroup
                                value={project.status}
                                onValueChange={(value) => changeStatus(value as ProjectStatus)}
                            >
                                {STATUS_CHOICES.map((status) => (
                                    <DropdownMenuRadioItem key={status} value={status}>
                                        {statusLabel(t, status)}
                                    </DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    {project.status === 'archived' ? (
                        <DropdownMenuItem onSelect={() => changeStatus('draft')}>
                            <RotateCcw className="size-4" aria-hidden="true" />
                            {t('actions.restoreToDrafts')}
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem
                            onSelect={() =>
                                update.mutate({
                                    id: project._id,
                                    data: { status: 'archived' },
                                    successMessage: t('actions.movedToArchive'),
                                })
                            }
                        >
                            <Archive className="size-4" aria-hidden="true" />
                            {t('actions.archive')}
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        variant="destructive"
                        onSelect={(event) => {
                            event.preventDefault();
                            setDeleteOpen(true);
                        }}
                    >
                        <Trash2 className="size-4" aria-hidden="true" />
                        {t('actions.remove')}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <DeleteProjectDialog
                project={project}
                open={deleteOpen}
                isPending={remove.isPending}
                onOpenChange={setDeleteOpen}
                onConfirm={() =>
                    remove.mutate(project._id, { onSettled: () => setDeleteOpen(false) })
                }
            />
        </>
    );
}
