'use client';

import Link from 'next/link';
import { Check, CircleDashed, Lock } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { useWorkflowStages } from '../../hooks/use-workflow-stages';
import { stageHref, type StageState } from '../../lib/stages';

function StageIcon({ stage, isCurrent }: { stage: StageState; isCurrent: boolean }) {
    if (stage.complete) {
        return (
            <span
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success"
                aria-hidden="true"
            >
                <Check className="size-3.5" />
            </span>
        );
    }
    if (stage.blockedReason) {
        return (
            <span
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                aria-hidden="true"
            >
                <Lock className="size-3.5" />
            </span>
        );
    }
    return (
        <span
            className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full border',
                isCurrent ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
            )}
            aria-hidden="true"
        >
            <CircleDashed className="size-3.5" />
        </span>
    );
}

/**
 * P11.2 — the guided production path.
 *
 * A stepper, not a wizard: the stages link INTO the existing workspace
 * surfaces (the tabs stay exactly as they are), and every stage's state is
 * derived from the assets that exist — never from a stored flag.
 *
 * - a completed stage is check-marked;
 * - the current stage (the first incomplete one) is highlighted and marked
 *   `aria-current="step"`;
 * - a blocked stage shows WHY it is blocked, not a bare lock.
 */
export function WorkflowStepper({ projectId }: { projectId: string }) {
    const { stages, currentStageId, isLoading } = useWorkflowStages(projectId);

    if (isLoading) {
        return <Skeleton className="h-20 w-full rounded-xl" aria-label="Loading workflow stages" />;
    }

    return (
        <nav aria-label="Production workflow" className="rounded-2xl border border-border/60 bg-card/40 p-3 md:p-4">
            <ol className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
                {stages.map((stage) => {
                    const isCurrent = stage.id === currentStageId;
                    const stateLabel = stage.complete
                        ? 'completed'
                        : stage.blockedReason
                          ? 'blocked'
                          : isCurrent
                            ? 'current step'
                            : 'not started';
                    return (
                        <li key={stage.id} className="shrink-0">
                            <Link
                                href={stageHref(projectId, stage)}
                                aria-current={isCurrent ? 'step' : undefined}
                                aria-label={`${stage.label} — ${stateLabel}`}
                                className={cn(
                                    'flex min-h-11 min-w-[11rem] flex-col gap-1 rounded-xl border px-3 py-2 transition-colors',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                    isCurrent
                                        ? 'border-primary/60 bg-primary/5'
                                        : 'border-border/60 hover:bg-muted/40'
                                )}
                            >
                                <span className="flex items-center gap-2">
                                    <StageIcon stage={stage} isCurrent={isCurrent} />
                                    <span className="text-sm font-medium">{stage.label}</span>
                                </span>
                                {stage.blockedReason && !stage.complete ? (
                                    <span className="text-xs text-muted-foreground">
                                        {stage.blockedReason}
                                    </span>
                                ) : stage.complete ? (
                                    <span className="text-xs text-muted-foreground">{stage.detail}</span>
                                ) : null}
                            </Link>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
