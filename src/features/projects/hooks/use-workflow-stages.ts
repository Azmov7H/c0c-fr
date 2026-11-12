'use client';

import * as React from 'react';

import { useProjectAudio } from '@/features/audio/hooks/use-audio';
import { useProjectMedia } from '@/features/media/hooks/use-media';
import { useProjectScripts } from '@/features/scripts/hooks/use-scripts';
import { useProjectThumbnails } from '@/features/thumbnails/hooks/use-thumbnails';

import { deriveStages, currentStageId, type StageState } from '../lib/stages';
import { useProject } from './use-projects';
import { useExportHistory } from './use-export-history';

/**
 * P11.1 — the workflow's only data source.
 *
 * Every stage is DERIVED from the assets the server already returns (the
 * same queries the assets tab and the media tab use — react-query serves
 * them from one cache), plus the export ledger from P09. There is no stored
 * workflow state and no client-side truth about what exists.
 */
export function useWorkflowStages(projectId: string): {
    stages: StageState[];
    currentStageId: string | null;
    isLoading: boolean;
} {
    const project = useProject(projectId);
    const scripts = useProjectScripts(projectId);
    const thumbnails = useProjectThumbnails(projectId);
    const audio = useProjectAudio(projectId);
    const media = useProjectMedia(projectId);
    const exports = useExportHistory(projectId);

    const stages = React.useMemo(
        () =>
            deriveStages({
                project: project.data,
                scripts: scripts.data ?? [],
                thumbnails: thumbnails.data ?? [],
                audio: audio.data ?? [],
                media: media.data?.data ?? [],
                exports: exports.data?.records ?? [],
            }),
        [project.data, scripts.data, thumbnails.data, audio.data, media.data, exports.data]
    );

    const isLoading =
        project.isLoading ||
        scripts.isLoading ||
        thumbnails.isLoading ||
        audio.isLoading ||
        media.isLoading ||
        exports.isLoading;

    return { stages, currentStageId: currentStageId(stages), isLoading };
}
