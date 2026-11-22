'use client';

import { useUrlLocale } from '@/i18n/locale';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from '@/lib/toast';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';

import { DirIcon } from '@/components/icons/dir-icon';
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
import { projectsValidationMessages } from '../lib/projects-validation-messages';
import { stepDescription, stepLabel } from '../lib/projects-labels';
import { StepDetails, StepPlatformTone, StepConfiguration, StepReview } from './new-project-steps';

const BLANK_VALUES: ProjectFormValues = {
    title: '',
    description: '',
    idea: '',
    platform: 'youtube',
    tone: 'educational',
    contentFormat: 'short',
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

function StepIndicator({ current }: { current: 1 | 2 | 3 | 4 }) {
    const t = useTranslations('projects');
    return (
        <ol className="flex items-center justify-center gap-2 sm:gap-3" aria-label={t('wizard.progressAria')}>
            {([1, 2, 3, 4] as const).map((step) => {
                const label = stepLabel(t, step);
                const complete = step < current;
                const active = step === current;
                return (
                    <li key={step} className="flex items-center gap-2 sm:gap-3">
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
                        {step < 4 ? (
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
    const t = useTranslations('projects');
    const locale = useUrlLocale();
    const router = useRouter();
    const create = useCreateProject();
    const onboarding = useOnboardingState();

    const [step, setStep] = useState<1 | 2 | 3 | 4>(initialDraft?.step ?? 1);
    const [restored, setRestored] = useState<ProjectDraft | null>(initialDraft);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [completed, setCompleted] = useState(false);

    // Refs are only touched from event handlers/effects: the compiler rejects
    // reading a ref inside a render-created callback.
    const submitted = useRef(false);
    const prefsApplied = useRef(false);

    const formSchema = useMemo(() => projectFormSchema(projectsValidationMessages(t)), [t]);
    const form = useForm<ProjectFormValues>({
        resolver: zodResolver(formSchema),
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
            form.setValue('idea', t('wizard.prefillIdea', { list }), {
                shouldDirty: false,
            });
        }
    }, [form, initialDraft, onboarding.data, t]);

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
            step === 1
                ? ['title', 'description', 'idea']
                : step === 2
                  ? ['platform', 'tone']
                  : ['contentFormat', 'durationSeconds'];
        const valid = await form.trigger(fields);
        if (valid && step < 4) setStep((current) => (current + 1) as 1 | 2 | 3 | 4);
    };

    const previousStep = () => {
        setStep((current) => (current - 1) as 1 | 2 | 3 | 4);
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
                toast.success(t('wizard.toast.created'));
                const destination =
                    returnTo === 'projects'
                        ? `/projects?created=${project._id}`
                        : `/projects/${project._id}`;
                router.replace(destination);
            },
            onError: (error) => {
                submitted.current = false;
                const apiError = toApiError(error, t('wizard.toast.createFailed'));
                if (apiError.code === 'ONBOARDING_INCOMPLETE') {
                    toast.error(t('wizard.toast.onboardingIncomplete'));
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
        if (step === 4) {
            onSubmitClick();
        } else {
            void nextStep();
        }
    };

    const title = (useWatch({ control: form.control, name: 'title' }) ?? '').trim();
    const primaryLabel =
        step === 4
            ? t('wizard.createWithTitle', {
                  title: title && title.length > 40 ? `${title.slice(0, 40)}…` : title || t('wizard.untitledProject'),
              })
            : t('wizard.continue');

    return (
        <div className="mx-auto max-w-3xl space-y-6 pb-8">
            <div className="flex items-center justify-between gap-3">
                <Button
                    type="button"
                    variant="ghost"
                    className="-ms-2 h-11 gap-2 text-muted-foreground hover:text-foreground"
                    onClick={requestCancel}
                >
                    <DirIcon name="ArrowLeft" className="size-4" aria-hidden="true" />
                    {t('wizard.backToProjects')}
                </Button>
                <StepIndicator current={step} />
            </div>

            {restored ? (
                <div
                    role="status"
                    className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                    <p className="text-sm">
                        <Sparkles className="me-2 inline size-4 text-primary" aria-hidden="true" />
                        {t('wizard.draftRestored', {
                            time: formatRelativeTime(restored.savedAt, locale).relative,
                        })}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-10"
                            onClick={startOver}
                        >
                            {t('wizard.startOver')}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-10"
                            onClick={() => setRestored(null)}
                        >
                            {t('wizard.dismiss')}
                        </Button>
                    </div>
                </div>
            ) : null}

            <div>
                <h1 className="font-display text-3xl font-extrabold tracking-tight">
                    {t('wizard.title')}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    {stepDescription(t, step)}
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
                        {step === 3 ? <StepConfiguration form={form} /> : null}
                        {step === 4 ? <StepReview form={form} onEdit={setStep} /> : null}
                    </div>

                    <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <Button
                            type="button"
                            variant="ghost"
                            className="h-11 sm:w-auto"
                            onClick={previousStep}
                            disabled={step === 1 || create.isPending}
                        >
                            <DirIcon name="ArrowLeft" className="me-2 size-4" aria-hidden="true" />
                            {t('wizard.back')}
                        </Button>

                        {step < 4 ? (
                            // key: React MUST mount a fresh node here instead of patching
                            // the button in place — one pending click's default action was
                            // re-evaluated against the patched-in type="submit" (T18 probe:
                            // a step-2 Continue created the project without anyone pressing
                            // Create). Distinct keys force the node swap instead.
                            <Button
                                key="continue"
                                type="button"
                                className="h-11 sm:px-8"
                                onClick={(event) => {
                                    // Belt: a type="button" has no default action — but the
                                    // element sits in a form next to a type="submit" sibling,
                                    // so the belt costs nothing.
                                    event.preventDefault();
                                    void nextStep();
                                }}
                            >
                                {primaryLabel}
                                <DirIcon name="ArrowRight" className="ms-2 size-4" aria-hidden="true" />
                            </Button>
                        ) : (
                            <Button
                                key="create"
                                type="submit"
                                className="h-11 max-w-full sm:px-8"
                                disabled={create.isPending}
                            >
                                {create.isPending ? (
                                    <>
                                        <Loader2
                                            className="me-2 size-4 animate-spin"
                                            aria-hidden="true"
                                        />
                                        {t('wizard.creating')}
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
                        <DialogTitle>{t('wizard.cancel.title')}</DialogTitle>
                        <DialogDescription>
                            {t('wizard.cancel.description')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="h-11"
                            onClick={() => setCancelOpen(false)}
                        >
                            {t('wizard.cancel.keepEditing')}
                        </Button>
                        <Button variant="destructive" className="h-11" onClick={discardAndLeave}>
                            {t('wizard.cancel.discardAndLeave')}
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
