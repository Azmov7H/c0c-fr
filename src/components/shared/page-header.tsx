import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * The page title block every dashboard page shares. Supersedes FeatureHeader,
 * which had the same job but only supported a single CTA (and seven pages had
 * each re-derived it). `breadcrumb` and `actions` are slots so a page can drop in
 * a `Breadcrumb` trail or any button group without this component growing a prop
 * per use case.
 *
 * The title is the one place `font-display` (Space Grotesk) is applied by default
 * — the display face does the expressive work on the one element that is
 * genuinely a heading; body copy stays Inter.
 */
interface PageHeaderProps {
    title: string;
    description?: string;
    breadcrumb?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}

export function PageHeader({
    title,
    description,
    breadcrumb,
    actions,
    className,
}: PageHeaderProps) {
    return (
        <div className={cn('space-y-3', className)}>
            {breadcrumb ? <div data-slot="breadcrumb">{breadcrumb}</div> : null}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-extrabold tracking-tight">
                        {title}
                    </h1>
                    {description ? (
                        <p className="text-sm text-muted-foreground mt-1">{description}</p>
                    ) : null}
                </div>
                {actions ? <div className="flex items-center gap-3" data-slot="actions">{actions}</div> : null}
            </div>
        </div>
    );
}
