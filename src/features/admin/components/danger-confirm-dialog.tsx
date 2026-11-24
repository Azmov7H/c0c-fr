'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
/**
 * `DangerConfirmDialog` (spec §7.2): type-to-confirm for destructive actions
 * ("role changes, deletion, and large grants" — spec §3.3). The confirm
 * button stays disabled until the typed value matches the target (trimmed,
 * case-insensitive — emails are case-insensitive in practice).
 */
export function DangerConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    consequence,
    target,
    confirmLabel,
    onConfirm,
    submitting,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    /** One-sentence warning shown between the description and the input. */
    consequence?: string;
    /** Email or name the caller asks the operator to type. */
    target: string;
    confirmLabel: string;
    onConfirm: () => void;
    submitting?: boolean;
}) {
    const t = useTranslations('admin');
    const [typed, setTyped] = useState('');
    const matches = typed.trim().length > 0 && typed.trim().toLowerCase() === target.trim().toLowerCase();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                {consequence ? <p className="text-sm text-destructive">{consequence}</p> : null}
                <div className="space-y-1.5">
                    <Label className="text-sm">{t('components.dangerConfirmDialog.typeLabel')}</Label>
                    <Input
                        value={typed}
                        onChange={(event) => setTyped(event.target.value)}
                        autoComplete="off"
                        className={cn(!matches && typed.length > 0 ? 'border-destructive' : undefined)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' && matches) onConfirm();
                        }}
                    />
                    {typed.length > 0 && !matches ? (
                        <p role="alert" className="text-xs text-destructive">
                            {t('components.dangerConfirmDialog.mismatch')}
                        </p>
                    ) : null}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {t('components.adminActionDialog.cancel')}
                    </Button>
                    <Button variant="destructive" onClick={onConfirm} disabled={!matches || submitting}>
                        {submitting
                            ? t('components.adminActionDialog.submitting')
                            : confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
