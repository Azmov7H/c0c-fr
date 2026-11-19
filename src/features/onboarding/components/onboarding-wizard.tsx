'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { LocalizedDataState } from '@/components/shared/localized-data-state';
import { Skeleton } from '@/components/ui/skeleton';
import { toApiError } from '@/lib/api-error';
import {
    emptyDraft,
    draftFromState,
    resumeStep,
    sameStepInput,
    stepInput,
    type OnboardingDraft,
} from '../lib/onboarding-draft';
import { REVIEW_STEP, missingForCompletion, validateStepAnswer } from '../lib/onboarding-schemas';
import { onboardingValidationMessages } from '../lib/onboarding-validation-messages';
import type { OnboardingOptions, SaveStepInput } from '../services/onboarding.service';
import {
    useCompleteOnboarding,
    useOnboardingOptions,
    useOnboardingState,
    useSaveOnboardingStep,
    useSkipOnboarding,
} from '../hooks/use-onboarding';
import { OnboardingCompletion } from './onboarding-completion';
import { SkipDialog } from './skip-dialog';
import {
    ExperienceStep,
    GoalsStep,
    NicheStep,
    PlatformsStep,
    ReviewStep,
    SubtopicsStep,
} from './step-panels';
import { WizardProgress } from './wizard-progress';

const TOTAL_STEPS = 6;

interface OnboardingWizardProps {
    /** `?edit=1` — reopen for an onboarded user without resetting completion. */
    edit?: boolean;
}

/**
 * The six-step wizard (T13).
 *
 * Local draft + server state: each advance persists one step through `PUT`
 * (T04), so closing the tab resumes at the last completed step. Validation is
 * per current step and always explains itself; nothing here hardcodes the
 * taxonomy.
 */
export function OnboardingWizard({ edit = false }: OnboardingWizardProps) {
    const router = useRouter();
    // AR-029 — the wizard's copy is catalog copy; the locale comes from the URL.
    const t = useTranslations('onboarding');
    const messages = onboardingValidationMessages(t);
    const optionsQuery = useOnboardingOptions();
    const stateQuery = useOnboardingState();
    const saveStep = useSaveOnboardingStep();
    const complete = useCompleteOnboarding();
    const skip = useSkipOnboarding();

    const [overrides, setOverrides] = React.useState<Partial<OnboardingDraft>>({});
    const [stepOverride, setStepOverride] = React.useState<number | null>(null);
    const [reason, setReason] = React.useState<string | null>(null);
    const [failedAdvance, setFailedAdvance] = React.useState(false);
    const [seededProjectId, setSeededProjectId] = React.useState<string | null>(null);
    const [done, setDone] = React.useState(false);

    const options = optionsQuery.data;
    const serverState = stateQuery.data;
    const alreadyComplete = serverState?.onboardingCompleted ?? false;

    /*
     * The draft is *derived*, not mirrored. Server state is the base; the
     * user's edits are an overlay. That removes the "initialise once when the
     * query resolves" effect — and with it the cascading render React's
     * compiler warns about — while still letting an optimistic save show
     * through immediately.
     */
    const draft: OnboardingDraft =
        options && serverState
            ? { ...draftFromState(serverState, options), ...overrides }
            : emptyDraft;
    const step = stepOverride ?? (serverState ? (edit ? 0 : resumeStep(serverState)) : 0);

    React.useEffect(() => {
        if (!done || edit) return;
        const timer = setTimeout(() => {
            router.push('/dashboard');
            router.refresh();
        }, 2500);
        return () => clearTimeout(timer);
    }, [done, edit, router]);

    const handleChange = (patch: Partial<OnboardingDraft>) => {
        setOverrides((current) => {
            const next = { ...current, ...patch };
            // Subtopics belong to the chosen niche; carrying them across a niche
            // change would show answers that are not on screen and fail validation.
            if (patch.niche !== undefined && patch.niche !== draft.niche) {
                next.subtopics = [];
            }
            return next;
        });
        setReason(null);
        setFailedAdvance(false);
    };

    const handleBack = () => {
        setReason(null);
        setFailedAdvance(false);
        setStepOverride((current) => Math.max(0, (current ?? step) - 1));
    };

    const handleNext = async () => {
        if (!options) return;
        setReason(null);

        const invalid = validateStepAnswer(step, draft, options, messages);
        if (invalid) {
            setReason(invalid);
            return;
        }

        const input = stepInput(step, draft);
        if (!input) {
            setReason(t('wizard.errors.chooseOption'));
            return;
        }

        const baseline = options && serverState ? stepInput(step, draftFromState(serverState, options)) : null;
        const unchanged = baseline !== null && sameStepInput(input, baseline);

        try {
            // Paging back and forward without editing must not move the saved
            // step backwards (T04 rewrites onboardingStep on every save).
            if (!unchanged) await saveStep.mutateAsync(input);
            setFailedAdvance(false);
            setStepOverride(Math.min(step + 1, REVIEW_STEP));
        } catch (error) {
            // Completed answers are never lost: the draft is untouched and the
            // advance button is the retry.
            setFailedAdvance(true);
            setReason(
                `${toApiError(error, t('wizard.errors.saveFailed')).message} ${t('wizard.reassurance')}`
            );
        }
    };

    const handleComplete = async () => {
        if (!options) return;
        setReason(null);

        if (edit && alreadyComplete) {
            router.push('/dashboard');
            router.refresh();
            return;
        }

        const missing = missingForCompletion(draft, options, messages);
        if (missing.length > 0) {
            setReason(t('wizard.stillNeeded', { items: missing.join(', ') }));
            return;
        }

        try {
            const result = await complete.mutateAsync();
            setSeededProjectId(result.seededProjectId);
            if (edit) {
                router.push('/dashboard');
                router.refresh();
                return;
            }
            setDone(true);
        } catch (error) {
            setReason(toApiError(error, t('wizard.errors.completeFailed')).message);
        }
    };

    const handleSkip = async () => {
        setReason(null);
        try {
            await skip.mutateAsync('not_now');
            router.push('/dashboard');
            router.refresh();
        } catch (error) {
            setReason(toApiError(error, t('wizard.errors.skipFailed')).message);
        }
    };

    if (done) {
        return <OnboardingCompletion projectId={seededProjectId} />;
    }

    if (optionsQuery.isLoading || stateQuery.isLoading) {
        return (
            <LocalizedDataState
                isLoading
                loadingFallback={<WizardSkeleton />}
            >
                {null}
            </LocalizedDataState>
        );
    }

    const queryError = optionsQuery.error ?? stateQuery.error;
    if (queryError || !options || options.niches.length === 0) {
        return (
            <LocalizedDataState
                error={queryError ?? new Error(t('wizard.errors.emptyTaxonomy'))}
                onRetry={() => {
                    void optionsQuery.refetch();
                    void stateQuery.refetch();
                }}
            >
                {null}
            </LocalizedDataState>
        );
    }

    const missing = missingForCompletion(draft, options, messages);
    const stepProps = { draft, options, onChange: handleChange };

    const panel = (() => {
        switch (step) {
            case 0:
                return <NicheStep {...stepProps} />;
            case 1:
                return <SubtopicsStep {...stepProps} />;
            case 2:
                return <PlatformsStep {...stepProps} />;
            case 3:
                return <ExperienceStep {...stepProps} />;
            case 4:
                return <GoalsStep {...stepProps} />;
            default:
                return <ReviewStep draft={draft} options={options} onEdit={setStepOverride} />;
        }
    })();

    const onReview = step === REVIEW_STEP;
    const pending = saveStep.isPending || complete.isPending || skip.isPending;

    return (
        <div className="mx-auto max-w-2xl space-y-8">
            <header className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">
                    {edit ? t('header.editTitle') : t('header.personaliseTitle')}
                </h1>
                <p className="text-sm text-muted-foreground">
                    {t('header.personaliseDescription')}
                </p>
            </header>

            <WizardProgress
                current={step}
                total={TOTAL_STEPS}
                steps={options.steps}
            />

            <div className="motion-safe:animate-in motion-safe:fade-in">{panel}</div>

            {reason ? (
                <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                    {reason}
                </p>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={step === 0 || pending}
                    className="min-h-11"
                >
                    {t('wizard.back')}
                </Button>

                <div className="flex flex-wrap items-center justify-end gap-3">
                    {!edit && step >= 1 ? (
                        <SkipDialog onConfirm={handleSkip} pending={skip.isPending} />
                    ) : null}

                    {onReview ? (
                        <>
                            {missing.length > 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    {t('wizard.toFinish', { items: missing.join(', ') })}
                                </p>
                            ) : null}
                            <Button
                                type="button"
                                onClick={handleComplete}
                                disabled={pending || missing.length > 0}
                                className="min-h-11"
                            >
                                {edit && alreadyComplete
                                    ? t('wizard.saveAndReturn')
                                    : complete.isPending
                                      ? t('wizard.finishing')
                                      : t('wizard.finishOnboarding')}
                            </Button>
                        </>
                    ) : (
                        <Button
                            type="button"
                            onClick={handleNext}
                            disabled={saveStep.isPending}
                            className="min-h-11"
                        >
                            {saveStep.isPending
                                ? t('wizard.saving')
                                : failedAdvance
                                  ? t('wizard.tryAgain')
                                  : t('wizard.continue')}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

function WizardSkeleton() {
    const t = useTranslations('onboarding');
    return (
        <div className="mx-auto max-w-2xl space-y-8">
            <div className="space-y-2">
                <Skeleton className="h-8 w-72" />
                <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-2 w-full" />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="h-11 w-full" />
                ))}
            </div>
            <span className="sr-only" role="status">{t('skeleton.loading')}</span>
        </div>
    );
}

export type { OnboardingOptions, SaveStepInput };
