'use client';

import type { ReactNode } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

import { StepUpPrompt } from './step-up-prompt';
import { useStepUpToken } from '../lib/step-up-context';

/**
 * `AdminActionDialog` (spec §7.2 + spec §3.3 mutation dialog template):
 * title (verb + object), context (current value + target), form (children
 * with inline validation), consequence (one sentence), step-up when required,
 * confirm button repeating the verb, error path (stays open).
 *
 * The caller owns validation/submission (`onSubmit`), success toasts with
 * `auditId`, and retry. This component owns the chrome and the step-up step.
 */
export function AdminActionDialog({
    open,
    onOpenChange,
    title,
    description,
    consequence,
    submitLabel,
    onSubmit,
    submitting,
    error,
    requiresStepUp,
    children,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Verb + object — e.g. "Grant credits to Mina K". */
    title: string;
    /** Context — current value(s) + target. */
    description?: string;
    /** One sentence of consequence (spec §3.3, step 4). */
    consequence?: string;
    /** Confirm button label — repeats the verb. */
    submitLabel: string;
    onSubmit: () => void;
    submitting?: boolean;
    error?: string | null;
    /** Step-up required (spec §3.3, step 5). */
    requiresStepUp?: boolean;
    children?: ReactNode;
}) {
    const t = useTranslations('admin');
    const token = useStepUpToken();
    const stepUpReady = !requiresStepUp || Boolean(token);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description ? <DialogDescription>{description}</DialogDescription> : null}
                </DialogHeader>
                {children}
                {consequence ? (
                    <p className="text-sm text-muted-foreground">{consequence}</p>
                ) : null}
                {requiresStepUp && !token ? <StepUpPrompt /> : null}
                {error ? (
                    <p role="alert" className="text-sm text-destructive">
                        {error}
                    </p>
                ) : null}
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {t('components.adminActionDialog.cancel')}
                    </Button>
                    <Button
                        onClick={onSubmit}
                        disabled={submitting || !stepUpReady}
                        className="gap-2"
                    >
                        {submitting
                            ? t('components.adminActionDialog.submitting')
                            : submitLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
