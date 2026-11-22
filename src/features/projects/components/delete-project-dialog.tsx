'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { Project } from '@/types';

interface DeleteProjectDialogProps {
    project: Project | null;
    open: boolean;
    isPending: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}

/**
 * Names the project in the title, and is explicit that the server archives
 * rather than destroys. The app has no restore route for soft-deleted rows, so
 * promising "you can undo this" would be a lie the UI cannot keep.
 */
export function DeleteProjectDialog({
    project,
    open,
    isPending,
    onOpenChange,
    onConfirm,
}: DeleteProjectDialogProps) {
    const t = useTranslations('projects');
    return (
        <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {project ? t('deleteDialog.titleWithProject', { title: project.title }) : t('deleteDialog.fallbackTitle')}
                    </DialogTitle>
                    <DialogDescription>{t('deleteDialog.description')}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        className="h-11"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                    >
                        {t('deleteDialog.keep')}
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        className="h-11"
                        onClick={onConfirm}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="me-2 size-4 animate-spin" aria-hidden="true" />
                                {t('deleteDialog.removing')}
                            </>
                        ) : (
                            t('deleteDialog.remove')
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
