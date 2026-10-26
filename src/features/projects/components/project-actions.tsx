'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { STATUS_LABEL } from '../lib/project-constants';
import { DeleteProjectDialog } from './delete-project-dialog';

const STATUS_CHOICES: ProjectStatus[] = ['draft', 'processing', 'completed'];

export function ProjectActions({ project }: { project: Project }) {
    const router = useRouter();
    const [deleteOpen, setDeleteOpen] = useState(false);
    const update = useUpdateProject();
    const remove = useDeleteProject();

    const changeStatus = (status: ProjectStatus) => {
        if (status === project.status) return;
        update.mutate({
            id: project._id,
            data: { status },
            successMessage: `Project marked ${STATUS_LABEL[status].toLowerCase()}.`,
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
                        aria-label={`Actions for ${project.title}`}
                    >
                        <MoreVertical className="size-4" aria-hidden="true" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="truncate">{project.title}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => router.push(`/projects/${project._id}`)}>
                        <ExternalLink className="size-4" aria-hidden="true" />
                        Open project
                    </DropdownMenuItem>

                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <RotateCcw className="size-4" aria-hidden="true" />
                            Change status
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuRadioGroup
                                value={project.status}
                                onValueChange={(value) => changeStatus(value as ProjectStatus)}
                            >
                                {STATUS_CHOICES.map((status) => (
                                    <DropdownMenuRadioItem key={status} value={status}>
                                        {STATUS_LABEL[status]}
                                    </DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    {project.status === 'archived' ? (
                        <DropdownMenuItem onSelect={() => changeStatus('draft')}>
                            <RotateCcw className="size-4" aria-hidden="true" />
                            Restore to drafts
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem
                            onSelect={() =>
                                update.mutate({
                                    id: project._id,
                                    data: { status: 'archived' },
                                    successMessage: 'Project moved to archive.',
                                })
                            }
                        >
                            <Archive className="size-4" aria-hidden="true" />
                            Archive
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
                        Remove…
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
