'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';

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
    const t = useTranslations('onboarding');

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="min-h-11 text-muted-foreground">
                    {t('skip.trigger')}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('skip.title')}</DialogTitle>
                    <DialogDescription>{t('skip.description')}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                        className="min-h-11"
                    >
                        {t('skip.keepGoing')}
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
                        {pending ? t('skip.skipping') : t('skip.confirm')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
