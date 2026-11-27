'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Clapperboard, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    useGenerateAnimationVideo,
    useProjectPreparation,
} from '@/features/advertisements/hooks/use-advertisements';

/**
 * A7 — the primary action is deliberately isolated from the workspace shell.
 * Readiness comes only from the backend-owned preparation document; one click
 * generates the composition and queues the separately metered render.
 */
export function GenerateAnimationVideoButton({ projectId }: { projectId: string }) {
    const router = useRouter();
    const t = useTranslations('advertisements');
    const preparation = useProjectPreparation(projectId);
    const generateAnimation = useGenerateAnimationVideo(projectId);
    const packageReady = preparation.data?.contentPackageReady === true;

    const generate = async () => {
        if (!packageReady || generateAnimation.isPending) return;
        await generateAnimation.mutateAsync();
        router.push(`/projects/${projectId}?tab=video`);
    };

    return (
        <Button
            className="h-11"
            disabled={!packageReady || preparation.isLoading || generateAnimation.isPending}
            onClick={() => void generate()}
        >
            {generateAnimation.isPending ? (
                <Loader2 className="me-2 size-4 animate-spin" aria-hidden="true" />
            ) : (
                <Clapperboard className="me-2 size-4" aria-hidden="true" />
            )}
            {generateAnimation.isPending ? t('workspace.generating') : t('workspace.generate')}
        </Button>
    );
}
