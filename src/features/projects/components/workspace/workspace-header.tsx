'use client';

import { useUrlLocale } from '@/i18n/locale';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
    Archive,
    ChevronDown,
    Clapperboard,
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
import { useInitializeProjectVideo } from '@/features/advertisements/hooks/use-advertisements';
import { advertisementsService } from '@/features/advertisements/services/advertisements.service';

import { useCreateProject, useDeleteProject, useUpdateProject } from '../../hooks/use-projects';
import { can } from '../../lib/permissions';
import { nextStatuses } from '../../lib/status';
import { statusLabel } from '../../lib/projects-labels';
import { workspaceAbsoluteTime, workspaceRelativeTime } from '../../lib/workspace-labels';
import { PlatformBadge, StatusBadge } from '../project-badges';
import { DeleteProjectDialog } from '../delete-project-dialog';
import { WorkflowStepper } from './workflow-stepper';
import type { ProjectRole } from '../../types';

interface WorkspaceHeaderProps {
    project: Project;
    role: ProjectRole;
    canEdit?: boolean;
}

export function WorkspaceHeader({ project, role }: WorkspaceHeaderProps) {
    const locale = useUrlLocale();
    const router = useRouter();
    const t = useTranslations('workspace');
    const tp = useTranslations('projects');
    const adsT = useTranslations('advertisements');
    const [editing, setEditing] = useState(false);
    const [confirmArchive, setConfirmArchive] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [ideaOpen, setIdeaOpen] = useState(false);
    const [preparingVideo, setPreparingVideo] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const update = useUpdateProject();
    const create = useCreateProject();
    const remove = useDeleteProject();
    const initializeVideo = useInitializeProjectVideo();
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
            successMessage: t('header.statusMarked', {
                status: statusLabel(tp, status).toLowerCase(),
            }),
        });
    };

    const duplicate = () => {
        create.mutate(
            {
                title: t('header.duplicateTitle', { title: project.title }),
                description: project.description,
                idea: project.idea,
                platform: project.platform,
                tone: project.tone,
            },
            { onSuccess: (created) => { window.location.assign(`/projects/${created._id}`); } }
        );
    };

    // Project-first entry point: initialize the 1:1 video child when needed,
    // then open the workspace tab where the gated Generate Video controls live.
    const openGenerateVideo = async () => {
        setPreparingVideo(true);
        try {
            const state = await advertisementsService.getProjectVideo(project._id);
            if (!state.initialized || !state.detail) {
                await initializeVideo.mutateAsync(project._id);
            }
        } finally {
            setPreparingVideo(false);
            router.push(`/projects/${project._id}?tab=video`);
        }
    };

    return (
        <header className="rounded-2xl border border-border/60 bg-card/60 p-4 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <nav aria-label={t('header.breadcrumb')} className="mb-2 text-xs text-muted-foreground">
                        <Link href="/dashboard" className="hover:text-foreground">{t('header.dashboard')}</Link>
                        <span aria-hidden="true"> / </span>
                        <Link href="/projects" className="hover:text-foreground">{t('header.projects')}</Link>
                        <span aria-hidden="true"> / </span>
                        <span className="text-foreground"><bdi>{project.title}</bdi></span>
                    </nav>

                    {editing ? (
                        <Input
                            ref={inputRef}
                            key={project.title}
                            dir="auto"
                            defaultValue={project.title}
                            onBlur={saveTitle}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') saveTitle();
                                if (event.key === 'Escape') {
                                    if (inputRef.current) inputRef.current.value = project.title;
                                    setEditing(false);
                                }
                            }}
                            aria-label={t('header.titleAria')}
                            maxLength={200}
                            className="h-11 max-w-xl text-xl font-bold"
                        />
                    ) : mayEdit ? (
                        <button
                            type="button"
                            onClick={() => setEditing(true)}
                            className="max-w-full truncate rounded text-start text-2xl font-bold hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label={t('header.editTitleAria', { title: project.title })}
                        >
                            <bdi>{project.title}</bdi>
                        </button>
                    ) : (
                        <h1 className="truncate text-2xl font-bold"><bdi>{project.title}</bdi></h1>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <PlatformBadge platform={project.platform} />
                        <StatusBadge status={project.status} />
                        <span className="text-xs text-muted-foreground" title={workspaceAbsoluteTime(t, project.updatedAt, locale)}>
                            {t('header.updated', { time: workspaceRelativeTime(t, project.updatedAt, locale) })}
                        </span>
                        <span className="text-xs text-muted-foreground" title={workspaceAbsoluteTime(t, project.createdAt, locale)}>
                            {t('header.created', { time: workspaceRelativeTime(t, project.createdAt, locale) })}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {mayEdit && (
                        <Button
                            className="h-11"
                            disabled={preparingVideo || initializeVideo.isPending}
                            onClick={() => void openGenerateVideo()}
                        >
                            {preparingVideo || initializeVideo.isPending ? (
                                <Loader2 className="me-2 size-4 animate-spin" aria-hidden="true" />
                            ) : (
                                <Clapperboard className="me-2 size-4" aria-hidden="true" />
                            )}
                            {preparingVideo || initializeVideo.isPending
                                ? adsT('workspace.generating')
                                : adsT('workspace.generate')}
                        </Button>
                    )}

                    {mayEdit && (
                        <Button
                            variant="outline"
                            className="h-11"
                            onClick={() => changeStatus(project.status === 'archived' ? 'draft' : 'archived')}
                        >
                            {project.status === 'archived' ? (
                                <><RotateCcw className="me-2 size-4" aria-hidden="true" />{t('header.restore')}</>
                            ) : (
                                <><Archive className="me-2 size-4" aria-hidden="true" />{t('header.archive')}</>
                            )}
                        </Button>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-11" aria-label={t('header.actionsAria')}>
                                <MoreHorizontal className="size-4" aria-hidden="true" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="truncate"><bdi>{project.title}</bdi></DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {mayEdit && (
                                <DropdownMenuItem onSelect={duplicate} disabled={create.isPending}>
                                    <Copy className="size-4" aria-hidden="true" />
                                    {t('header.duplicate')}
                                </DropdownMenuItem>
                            )}
                            {mayEdit && nextStatuses(project.status).map((status) => (
                                <DropdownMenuItem key={status} onSelect={() => changeStatus(status)}>
                                    {t('header.markAs', { status: statusLabel(tp, status).toLowerCase() })}
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
                                        {t('header.remove')}
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* P11.2: the guided production path. It links into the existing
                tabs — the workspace groupings stay exactly as they were. */}
            <div className="mt-4">
                <WorkflowStepper projectId={project._id} />
            </div>

            <button
                type="button"
                onClick={() => setIdeaOpen((open) => !open)}
                aria-expanded={ideaOpen}
                className="mt-4 flex min-h-11 items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                <ChevronDown className={`size-4 transition-transform ${ideaOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                {t('header.idea')}
            </button>
            {ideaOpen && (
                <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-foreground/90">
                    {project.idea}
                </p>
            )}

            <Dialog open={confirmArchive} onOpenChange={setConfirmArchive}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('header.archiveTitle', { title: project.title })}</DialogTitle>
                        <DialogDescription>
                            {t('header.archiveDescription')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" className="h-11" onClick={() => setConfirmArchive(false)}>
                            {t('header.keepActive')}
                        </Button>
                        <Button
                            className="h-11"
                            disabled={update.isPending}
                            onClick={() => {
                                setConfirmArchive(false);
                                changeStatus('archived');
                            }}
                        >
                            {update.isPending && <Loader2 className="me-2 size-4 animate-spin" aria-hidden="true" />}
                            {t('header.archiveProject')}
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
