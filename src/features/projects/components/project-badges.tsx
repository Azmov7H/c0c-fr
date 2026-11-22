import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Platform, ProjectStatus } from '@/types';

import { PLATFORM_ICON } from '../lib/project-constants';
import { platformLabel, statusLabel } from '../lib/projects-labels';

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
    facebook: 'bg-info/10 text-info border-info/20',
};

export function PlatformBadge({ platform }: { platform: Platform }) {
    const Icon = PLATFORM_ICON[platform];
    const t = useTranslations('projects');
    return (
        <Badge variant="outline" className={cn('gap-1.5 font-medium', PLATFORM_STYLE[platform])}>
            <Icon className="size-3" aria-hidden="true" />
            {platformLabel(t, platform)}
        </Badge>
    );
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
    const t = useTranslations('projects');
    return (
        <Badge variant="outline" className={cn('font-medium', STATUS_STYLE[status])}>
            {statusLabel(t, status)}
        </Badge>
    );
}
