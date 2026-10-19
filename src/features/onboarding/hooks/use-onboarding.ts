import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { onboardingService, type OnboardingState, type SaveStepInput, type SkipReason } from '../services/onboarding.service';
import { applyStepToState } from '../lib/onboarding-draft';
import { useAuthStore } from '@/store/auth-store';

export const onboardingKeys = {
    all: ['onboarding'] as const,
    options: () => [...onboardingKeys.all, 'options'] as const,
    state: () => [...onboardingKeys.all, 'state'] as const,
};

/**
 * The taxonomy is reference data: it changes with a backend deploy, never
 * mid-session, so it is cached for the life of the tab (card §3).
 */
export function useOnboardingOptions() {
    return useQuery({
        queryKey: onboardingKeys.options(),
        queryFn: () => onboardingService.getOptions(),
        staleTime: Infinity,
    });
}

export function useOnboardingState() {
    return useQuery({
        queryKey: onboardingKeys.state(),
        queryFn: () => onboardingService.getState(),
    });
}

/**
 * Persist one step on advance.
 *
 * Optimistic with rollback so a slow network does not re-lock the step the user
 * just finished; the server response is authoritative and is refetched on
 * settle. Errors are surfaced by the caller next to the advance button, never
 * as a toast that leaves the answers in doubt.
 */
export function useSaveOnboardingStep() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: SaveStepInput) => onboardingService.saveStep(input),
        onMutate: async (input) => {
            await queryClient.cancelQueries({ queryKey: onboardingKeys.state() });
            const previous = queryClient.getQueryData<OnboardingState>(onboardingKeys.state());
            if (previous) {
                queryClient.setQueryData(onboardingKeys.state(), applyStepToState(previous, input));
            }
            return { previous };
        },
        onError: (_error, _input, context) => {
            if (context?.previous) {
                queryClient.setQueryData(onboardingKeys.state(), context.previous);
            }
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: onboardingKeys.state() });
        },
    });
}

/** Shared tail of completion and skip: session flag + user-scoped cache. */
function useOnboardingFinished() {
    const setUser = useAuthStore((state) => state.setUser);
    const queryClient = useQueryClient();

    return (step: number, options: { invalidateProjects: boolean }) => {
        const current = useAuthStore.getState().user;
        if (current) {
            setUser({ ...current, onboardingCompleted: true, onboardingStep: step });
        }
        queryClient.removeQueries({ queryKey: onboardingKeys.all });
        if (options.invalidateProjects) {
            void queryClient.invalidateQueries({ queryKey: ['projects'] });
        }
        void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };
}

/**
 * Mark complete. Navigation is left to the caller so the wizard can show the
 * seeded project's link before redirecting (card §8).
 */
export function useCompleteOnboarding() {
    const finish = useOnboardingFinished();

    return useMutation({
        mutationFn: () => onboardingService.complete(),
        onSuccess: (data) => {
            finish(5, { invalidateProjects: Boolean(data.seededProjectId) });
        },
    });
}

export function useSkipOnboarding() {
    const finish = useOnboardingFinished();

    return useMutation({
        mutationFn: (reason?: SkipReason) => onboardingService.skip(reason),
        onSuccess: () => {
            finish(6, { invalidateProjects: true });
        },
    });
}
