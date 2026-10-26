import { Instagram, PlaySquare, Youtube } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Platform, ProjectStatus } from '@/types';

import { PLATFORM_LABEL, STATUS_LABEL } from '../lib/project-constants';

const PLATFORM_ICON: Record<Platform, typeof Youtube> = {
    youtube: Youtube,
    tiktok: PlaySquare,
    instagram: Instagram,
};

const STATUS_STYLE: Record<ProjectStatus, string> = {
    draft: 'bg-warning/10 text-warning border-warning/20',
    processing: 'bg-primary/10 text-primary border-primary/20',
    completed: 'bg-success/10 text-success border-success/20',
    archived: 'bg-muted text-muted-foreground border-border',
};

const PLATFORM_STYLE: Record<Platform, string> = {
    youtube: 'bg-brand-red/10 text-brand-red border-brand-red/20',
    tiktok: 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20',
    instagram: 'bg-brand-pink/10 text-brand-pink border-brand-pink/20',
};

export function PlatformBadge({ platform }: { platform: Platform }) {
    const Icon = PLATFORM_ICON[platform];
    return (
        <Badge variant="outline" className={cn('gap-1.5 font-medium', PLATFORM_STYLE[platform])}>
            <Icon className="size-3" aria-hidden="true" />
            {PLATFORM_LABEL[platform]}
        </Badge>
    );
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
    return (
        <Badge variant="outline" className={cn('font-medium', STATUS_STYLE[status])}>
            {STATUS_LABEL[status]}
        </Badge>
    );
}
