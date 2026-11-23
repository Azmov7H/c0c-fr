'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

/**
 * Monospace id cell with a copy button (spec §7.2, `IdCell`).
 *
 * Ids are selectable and copyable; the text is `tabular-nums` so id alignment
 * reads consistently across rows.
 */
export function IdCell({ id, className }: { id: string; className?: string }) {
    const t = useTranslations('admin');
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(id);
            setCopied(true);
            toast.success(t('components.idCell.copied'));
        } catch {
            // Clipboard is best-effort here — the id stays visible/selectable.
        }
    };

    return (
        <span className={cn('inline-flex items-center gap-1.5', className)}>
            <span className="font-mono text-xs tabular-nums select-all">{id}</span>
            <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0 text-muted-foreground"
                aria-label={t('components.idCell.copy')}
                title={t('components.idCell.copy')}
                onClick={() => void copy()}
            >
                {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
            </Button>
        </span>
    );
}
