import Link from 'next/link';
import { LockKeyhole } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCount, formatDate } from '../lib/format';

interface UpgradePromptProps {
    title: string;
    description: string;
    ctaLabel?: string;
    href?: string;
    feature?: string;
    used?: number;
    limit?: number | null;
    resetAt?: string | null;
    className?: string;
}

export function UpgradePrompt({
    title,
    description,
    ctaLabel = 'See plans',
    href = '/settings/billing',
    feature,
    used,
    limit,
    resetAt,
    className,
}: UpgradePromptProps) {
    const hasUsage = typeof used === 'number' && limit !== undefined;

    return (
        <div
            className={cn(
                'flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/60 p-6 text-center',
                className
            )}
            data-upgrade-feature={feature}
        >
            <div className="rounded-full bg-muted p-3">
                <LockKeyhole className="size-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium">{title}</p>
            <p className="max-w-md text-sm text-muted-foreground">{description}</p>
            {hasUsage ? (
                <p className="text-xs text-muted-foreground">
                    {formatCount(used)} of{' '}
                    {limit === null ? 'unlimited' : formatCount(limit)} used
                    {resetAt ? ` · resets ${formatDate(resetAt)}` : ''}
                </p>
            ) : null}
            <Button size="sm" variant="outline" asChild>
                <Link href={href}>{ctaLabel}</Link>
            </Button>
        </div>
    );
}
