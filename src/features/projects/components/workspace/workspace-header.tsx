'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
    Archive,
    ChevronDown,
    Copy,
    Loader2,
    MoreHorizontal,
    RotateCcw,
    Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Project, ProjectStatus } from '@/types';
import { formatAbsoluteTime, formatRelativeTime } from '@/lib/relative-time';

import { useCreateProject, useDeleteProject, useUpdateProject } from '../../hooks/use-projects';
import { can } from '../../lib/permissions';
import { nextStatuses } from '../../lib/status';
import { STATUS_LABEL } from '../../lib/project-schemas';
import { PlatformBadge, StatusBadge } from '../project-badges';
import { DeleteProjectDialog } from '../delete-project-dialog';
import type { ProjectRole } from '../../types';

interface WorkspaceHeaderProps {
    project: Project;
    role: ProjectRole;
    canEdit?: boolean;
}

export function WorkspaceHeader({ project, role }: WorkspaceHeaderProps) {
    const [editing, setEditing] = useState(false);
    const [confirmArchive, setConfirmArchive] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [ideaOpen, setIdeaOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const update = useUpdateProject();
    const create = useCreateProject();
    const remove = useDeleteProject();
    const mayEdit = can(role, 'edit');
    const mayManage = can(role, 'manage');

    useEffect(() => {
        if (editing) inputRef.current?.focus();
    }, [editing]);

    const saveTitle = () => {
        setEditing(false);
        const next = inputRef.current?.value.trim() ?? '';
        if (!next || next === project.title) {
            if (inputRef.current) inputRef.current.value = project.title;
            return;
        }
        update.mutate({ id: project._id, data: { title: next } });
    };

    const changeStatus = (status: ProjectStatus) => {
        if (status === project.status) return;
        if (status === 'archived') {
            setConfirmArchive(true);
            return;
        }
        update.mutate({
            id: project._id,
            data: { status },
            successMessage: `Project marked ${STATUS_LABEL[status].toLowerCase()}.`,
        });
    };

    const duplicate = () => {
        create.mutate(
            {
                title: `${project.title} (copy)`,
                description: project.description,
                idea: project.idea,
                platform: project.platform,
                tone: project.tone,
            },
            { onSuccess: (created) => { window.location.assign(`/projects/${created._id}`); } }
        );
    };

    return (
        <header className="rounded-2xl border border-border/60 bg-card/60 p-4 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <nav aria-label="Breadcrumb" className="mb-2 text-xs text-muted-foreground">
                        <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
                        <span aria-hidden="true"> / </span>
                        <Link href="/projects" className="hover:text-foreground">Projects</Link>
                        <span aria-hidden="true"> / </span>
                        <span className="text-foreground">{project.title}</span>
                    </nav>

                    {editing ? (
                        <Input
                            ref={inputRef}
                            key={project.title}
                            defaultValue={project.title}
                            onBlur={saveTitle}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') saveTitle();
                                if (event.key === 'Escape') {
                                    if (inputRef.current) inputRef.current.value = project.title;
                                    setEditing(false);
                                }
                            }}
                            aria-label="Project title"
                            maxLength={200}
                            className="h-11 max-w-xl text-xl font-bold"
                        />
                    ) : mayEdit ? (
                        <button
                            type="button"
                            onClick={() => setEditing(true)}
                            className="max-w-full truncate rounded text-left text-2xl font-bold hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label={`Edit project title: ${project.title}`}
                        >
                            {project.title}
                        </button>
                    ) : (
                        <h1 className="truncate text-2xl font-bold">{project.title}</h1>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <PlatformBadge platform={project.platform} />
                        <StatusBadge status={project.status} />
                        <span className="text-xs text-muted-foreground" title={formatAbsoluteTime(project.updatedAt)}>
                            Updated {formatRelativeTime(project.updatedAt).relative}
                        </span>
                        <span className="text-xs text-muted-foreground" title={formatAbsoluteTime(project.createdAt)}>
                            Created {formatRelativeTime(project.createdAt).relative}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {mayEdit && (
                        <Button
                            variant="outline"
                            className="h-11"
                            onClick={() => changeStatus(project.status === 'archived' ? 'draft' : 'archived')}
                        >
                            {project.status === 'archived' ? (
                                <><RotateCcw className="mr-2 size-4" aria-hidden="true" />Restore</>
                            ) : (
                                <><Archive className="mr-2 size-4" aria-hidden="true" />Archive</>
                            )}
                        </Button>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-11" aria-label="Project actions">
                                <MoreHorizontal className="size-4" aria-hidden="true" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="truncate">{project.title}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {mayEdit && (
                                <DropdownMenuItem onSelect={duplicate} disabled={create.isPending}>
                                    <Copy className="size-4" aria-hidden="true" />
                                    Duplicate project
                                </DropdownMenuItem>
                            )}
                            {mayEdit && nextStatuses(project.status).map((status) => (
                                <DropdownMenuItem key={status} onSelect={() => changeStatus(status)}>
                                    Mark as {STATUS_LABEL[status].toLowerCase()}
                                </DropdownMenuItem>
                            ))}
                            {mayManage && (
                                <>
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
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <button
                type="button"
                onClick={() => setIdeaOpen((open) => !open)}
                aria-expanded={ideaOpen}
                className="mt-4 flex min-h-11 items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                <ChevronDown className={`size-4 transition-transform ${ideaOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                Project idea
            </button>
            {ideaOpen && (
                <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-foreground/90">
                    {project.idea}
                </p>
            )}

            <Dialog open={confirmArchive} onOpenChange={setConfirmArchive}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Archive “{project.title}”?</DialogTitle>
                        <DialogDescription>
                            It moves to the project archive and leaves the active list. You can restore it to drafts later.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" className="h-11" onClick={() => setConfirmArchive(false)}>
                            Keep active
                        </Button>
                        <Button
                            className="h-11"
                            disabled={update.isPending}
                            onClick={() => {
                                setConfirmArchive(false);
                                changeStatus('archived');
                            }}
                        >
                            {update.isPending && <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />}
                            Archive project
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <DeleteProjectDialog
                project={project}
                open={deleteOpen}
                isPending={remove.isPending}
                onOpenChange={setDeleteOpen}
                onConfirm={() =>
                    remove.mutate(project._id, {
                        onSuccess: () => {
                            setDeleteOpen(false);
                            window.location.assign('/projects');
                        },
                        onSettled: () => setDeleteOpen(false),
                    })
                }
            />
        </header>
    );
}
