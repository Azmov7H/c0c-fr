'use client';

import { Loader2 } from 'lucide-react';

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
    return (
        <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Remove {project ? `“${project.title}”` : 'this project'}?</DialogTitle>
                    <DialogDescription>
                        It disappears from your workspace. The server keeps an archived record, but
                        this app cannot restore it yet.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        className="h-11"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                    >
                        Keep project
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
                                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                                Removing…
                            </>
                        ) : (
                            'Remove project'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
