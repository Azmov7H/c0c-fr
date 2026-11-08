'use client';

import { MediaWorkspace } from '@/features/media/components/media-workspace/media-workspace';
import type { ProjectRole } from '../../types';
import { can } from '../../lib/permissions';

export function MediaTab({ projectId, role }: { projectId: string; role: ProjectRole }) {
    // Capability gate reused (M2-T22 IA); generation/replace lives behind it.
    const mayView = can(role, 'edit') || can(role, 'read');
    if (!mayView) {
        return <p className="text-sm text-muted-foreground">You do not have access to this project&apos;s media.</p>;
    }
    return <MediaWorkspace projectId={projectId} />;
}
