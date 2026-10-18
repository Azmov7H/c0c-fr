import * as React from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * A card with a consistent header treatment (title, optional description,
 * optional actions) and content padding. Pages previously wrote
 * `Card + CardHeader + border-b + CardTitle` by hand with slightly different
 * paddings each time, which is how a design system erodes.
 */
interface SectionCardProps {
    title: React.ReactNode;
    description?: string;
    actions?: React.ReactNode;
    className?: string;
    contentClassName?: string;
    children: React.ReactNode;
}

export function SectionCard({
    title,
    description,
    actions,
    className,
    contentClassName,
    children,
}: SectionCardProps) {
    return (
        <Card className={cn('border-border/50', className)}>
            <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border/50 pb-4">
                <div className="space-y-1">
                    <CardTitle className="text-base font-bold">{title}</CardTitle>
                    {description ? <CardDescription>{description}</CardDescription> : null}
                </div>
                {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
            </CardHeader>
            <CardContent className={cn('p-6', contentClassName)}>{children}</CardContent>
        </Card>
    );
}
