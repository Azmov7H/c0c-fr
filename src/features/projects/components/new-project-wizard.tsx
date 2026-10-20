'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { toApiError } from '@/lib/api-error';
import { formatRelativeTime } from '@/lib/relative-time';
import { cn } from '@/lib/utils';
import { useOnboardingState } from '@/features/onboarding/hooks/use-onboarding';

import { useCreateProject } from '../hooks/use-projects';
import {
    PROJECT_DRAFT_KEY,
    canRestoreDraft,
    clearProjectDraft,
    draftIsEmpty,
    readProjectDraft,
    writeProjectDraft,
    type ProjectDraft,
} from '../lib/project-draft';
import { projectFormSchema, type ProjectFormValues } from '../lib/project-schemas';
import { StepDetails, StepPlatformTone, StepReview } from './new-project-steps';

const STEP_LABELS = ['Details', 'Platform & tone', 'Review'] as const;
const BLANK_VALUES: ProjectFormValues = {
    title: '',
    description: '',
    idea: '',
    platform: 'youtube',
    tone: 'educational',
};

function subscribeToDraft(listener: () => void): () => void {
    window.addEventListener('storage', listener);
    return () => window.removeEventListener('storage', listener);
}

function getDraftSnapshot(): string {
    try {
        return window.sessionStorage.getItem(PROJECT_DRAFT_KEY) ?? '';
    } catch {
        return '';
    }
}

const getServerDraftSnapshot = () => '';

/**
 * Reads the autosaved draft through an external store rather than an effect.
 * The server snapshot is empty, so hydration starts blank and React re-renders
 * with the stored draft immediately after — no hydration mismatch, no
 * setState-in-effect cascade.
 */
function useRestoredDraft(): ProjectDraft | null {
    const raw = useSyncExternalStore(
        subscribeToDraft,
        getDraftSnapshot,
        getServerDraftSnapshot
    );

    return useMemo(() => {
        if (!raw) return null;
        const draft = readProjectDraft(window.sessionStorage);
        return canRestoreDraft(draft) ? draft : null;
    }, [raw]);
}

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
    return (
        <ol className="flex items-center justify-center gap-2 sm:gap-3" aria-label="Progress">
            {STEP_LABELS.map((label, index) => {
                const step = (index + 1) as 1 | 2 | 3;
                const complete = step < current;
                const active = step === current;
                return (
                    <li key={label} className="flex items-center gap-2 sm:gap-3">
                        <div
                            className={cn(
                                'flex size-9 items-center justify-center rounded-xl border-2 text-sm font-bold transition-colors',
                                complete && 'border-primary bg-primary text-primary-foreground',
                                active && 'border-primary text-primary ring-4 ring-primary/10',
                                !complete && !active && 'border-muted bg-muted/20 text-muted-foreground'
                            )}
                            aria-current={active ? 'step' : undefined}
                        >
                            {complete ? <CheckCircle2 className="size-4" aria-hidden="true" /> : step}
                        </div>
                        <span
                            className={cn(
                                'hidden text-xs font-semibold sm:block',
                                active ? 'text-foreground' : 'text-muted-foreground'
                            )}
                        >
                            {label}
                        </span>
                        {index < STEP_LABELS.length - 1 ? (
                            <span
                                aria-hidden="true"
                                className={cn(
                                    'h-1 w-6 rounded-full sm:w-10',
                                    complete ? 'bg-primary' : 'bg-muted'
                                )}
                            />
                        ) : null}
                    </li>
                );
            })}
        </ol>
    );
}

function WizardForm({
    initialDraft,
    returnTo,
}: {
    initialDraft: ProjectDraft | null;
    returnTo?: 'projects';
}) {
    const router = useRouter();
    const create = useCreateProject();
    const onboarding = useOnboardingState();

    const [step, setStep] = useState<1 | 2 | 3>(initialDraft?.step ?? 1);
    const [restored, setRestored] = useState<ProjectDraft | null>(initialDraft);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [completed, setCompleted] = useState(false);

    // Refs are only touched from event handlers/effects: the compiler rejects
    // reading a ref inside a render-created callback.
    const submitted = useRef(false);
    const prefsApplied = useRef(false);

    const form = useForm<ProjectFormValues>({
        resolver: zodResolver(projectFormSchema),
        defaultValues: { ...BLANK_VALUES, ...initialDraft?.values },
        mode: 'onChange',
    });

    useEffect(() => {
        if (prefsApplied.current || !onboarding.data) return;
        prefsApplied.current = true;

        const preferred = onboarding.data.preferredPlatforms[0];
        if (preferred && !initialDraft) {
            form.setValue('platform', preferred, { shouldDirty: false });
        }

        const interests = onboarding.data.interests
            .map((entry) => entry.topic.replace(/[-_]/g, ' '))
            .slice(0, 3);
        if (interests.length > 0 && !form.getValues('idea').trim()) {
            const list =
                interests.length === 1
                    ? interests[0]
                    : `${interests.slice(0, -1).join(', ')} and ${interests[interests.length - 1]}`;
            form.setValue('idea', `I want to create content about ${list}.`, {
                shouldDirty: false,
            });
        }
    }, [form, initialDraft, onboarding.data]);

    const watchedValues = useWatch({ control: form.control });

    useEffect(() => {
        if (completed) return;
        const timer = setTimeout(() => {
            if (!draftIsEmpty(watchedValues)) {
                writeProjectDraft(window.sessionStorage, watchedValues, step);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [completed, step, watchedValues]);

    const nextStep = async () => {
        const fields: Array<keyof ProjectFormValues> =
            step === 1 ? ['title', 'description', 'idea'] : ['platform', 'tone'];
        const valid = await form.trigger(fields);
        if (valid && step < 3) setStep((current) => (current + 1) as 1 | 2 | 3);
    };

    const previousStep = () => {
        setStep((current) => (current - 1) as 1 | 2 | 3);
    };

    const clearDraft = () => {
        clearProjectDraft(window.sessionStorage);
        setRestored(null);
    };

    const startOver = () => {
        clearDraft();
        form.reset(BLANK_VALUES);
        setStep(1);
    };

    const requestCancel = () => {
        const hasInput = form.formState.isDirty || !draftIsEmpty(form.getValues());
        if (hasInput) {
            setCancelOpen(true);
            return;
        }
        router.push('/projects');
    };

    const discardAndLeave = () => {
        setCompleted(true);
        clearDraft();
        router.push('/projects');
    };

    const onValid = (values: ProjectFormValues) => {
        create.mutate(values, {
            onSuccess: (project) => {
                setCompleted(true);
                clearProjectDraft(window.sessionStorage);
                toast.success('Project created.');
                const destination =
                    returnTo === 'projects'
                        ? `/projects?created=${project._id}`
                        : `/projects/${project._id}`;
                router.replace(destination);
            },
            onError: (error) => {
                submitted.current = false;
                const apiError = toApiError(error, 'Could not create the project.');
                if (apiError.code === 'ONBOARDING_INCOMPLETE') {
                    toast.error('Finish onboarding before creating a project.');
                    router.push('/onboarding?from=create-project');
                }
            },
        });
    };

    const onSubmitClick = () => {
        if (submitted.current || create.isPending) return;
        submitted.current = true;
        void form.handleSubmit(onValid, () => {
            submitted.current = false;
        })();
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            requestCancel();
            return;
        }
        if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;

        const target = event.target as HTMLElement;
        const isTextField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
        if (!isTextField) return;

        if (target.tagName === 'TEXTAREA' && event.shiftKey) return;

        event.preventDefault();
        if (step === 3) {
            onSubmitClick();
        } else {
            void nextStep();
        }
    };

    const title = (useWatch({ control: form.control, name: 'title' }) ?? '').trim();
    const primaryLabel =
        step === 3
            ? `Create “${title && title.length > 40 ? `${title.slice(0, 40)}…` : title || 'project'}”`
            : 'Continue';

    return (
        <div className="mx-auto max-w-3xl space-y-6 pb-8">
            <div className="flex items-center justify-between gap-3">
                <Button
                    type="button"
                    variant="ghost"
                    className="-ml-2 h-11 gap-2 text-muted-foreground hover:text-foreground"
                    onClick={requestCancel}
                >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Projects
                </Button>
                <StepIndicator current={step} />
            </div>

            {restored ? (
                <div
                    role="status"
                    className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                    <p className="text-sm">
                        <Sparkles className="mr-2 inline size-4 text-primary" aria-hidden="true" />
                        Draft restored from {formatRelativeTime(restored.savedAt).relative}.
                    </p>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-10"
                            onClick={startOver}
                        >
                            Start over
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-10"
                            onClick={() => setRestored(null)}
                        >
                            Dismiss
                        </Button>
                    </div>
                </div>
            ) : null}

            <div>
                <h1 className="font-display text-3xl font-extrabold tracking-tight">
                    Create a project
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    {step === 1
                        ? 'Define the idea. This becomes the seed for your scripts.'
                        : step === 2
                          ? 'Choose where it will live and how it should sound.'
                          : 'Check everything before we create the workspace.'}
                </p>
            </div>

            <Form {...form}>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        onSubmitClick();
                    }}
                    onKeyDown={onKeyDown}
                    noValidate
                    className="space-y-6"
                >
                    <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-6">
                        {step === 1 ? <StepDetails form={form} /> : null}
                        {step === 2 ? <StepPlatformTone form={form} /> : null}
                        {step === 3 ? <StepReview form={form} onEdit={setStep} /> : null}
                    </div>

                    <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <Button
                            type="button"
                            variant="ghost"
                            className="h-11 sm:w-auto"
                            onClick={previousStep}
                            disabled={step === 1 || create.isPending}
                        >
                            <ArrowLeft className="mr-2 size-4" aria-hidden="true" />
                            Back
                        </Button>

                        {step < 3 ? (
                            <Button
                                type="button"
                                className="h-11 sm:px-8"
                                onClick={() => void nextStep()}
                            >
                                {primaryLabel}
                                <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                className="h-11 max-w-full sm:px-8"
                                disabled={create.isPending}
                            >
                                {create.isPending ? (
                                    <>
                                        <Loader2
                                            className="mr-2 size-4 animate-spin"
                                            aria-hidden="true"
                                        />
                                        Creating…
                                    </>
                                ) : (
                                    <span className="truncate">{primaryLabel}</span>
                                )}
                            </Button>
                        )}
                    </div>
                </form>
            </Form>

            <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Discard this draft?</DialogTitle>
                        <DialogDescription>
                            Your title, idea and platform choices have been autosaved in this tab.
                            Leaving now discards them.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="h-11"
                            onClick={() => setCancelOpen(false)}
                        >
                            Keep editing
                        </Button>
                        <Button variant="destructive" className="h-11" onClick={discardAndLeave}>
                            Discard and leave
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export function NewProjectWizard({ returnTo }: { returnTo?: 'projects' }) {
    const draft = useRestoredDraft();

    return (
        <WizardForm
            key={draft?.savedAt ?? 'new-draft'}
            initialDraft={draft}
            returnTo={returnTo}
        />
    );
}
