'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

interface SkipDialogProps {
    onConfirm: () => void;
    pending?: boolean;
}

/**
 * Skip is possible but not the obvious path (card §7): a small secondary link
 * behind a confirmation that spells out the trade-off — a skipped user still
 * gets a working dashboard, but with generic defaults and no seeded project
 * from their own interests.
 */
export function SkipDialog({ onConfirm, pending }: SkipDialogProps) {
    const [open, setOpen] = React.useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="min-h-11 text-muted-foreground">
                    Skip for now
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Skip personalisation?</DialogTitle>
                    <DialogDescription>
                        Your dashboard will use generic defaults instead of your interests, and
                        skipping forfeits the starter allowance for your first project. You can
                        update your interests later from Account settings.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                        className="min-h-11"
                    >
                        Keep going
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        disabled={pending}
                        className="min-h-11"
                        onClick={() => {
                            setOpen(false);
                            onConfirm();
                        }}
                    >
                        {pending ? 'Skipping…' : 'Skip onboarding'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
