'use client';

import { useTranslations } from 'next-intl';
import { MediaWorkspace } from '@/features/media/components/media-workspace/media-workspace';
import type { ProjectRole } from '../../types';
import { can } from '../../lib/permissions';

export function MediaTab({ projectId, role }: { projectId: string; role: ProjectRole }) {
    const t = useTranslations('workspace');
    // Capability gate reused (M2-T22 IA); generation/replace lives behind it.
    const mayView = can(role, 'edit') || can(role, 'read');
    if (!mayView) {
        return <p className="text-sm text-muted-foreground">{t('assets.accessDenied')}</p>;
    }
    return <MediaWorkspace projectId={projectId} />;
}
