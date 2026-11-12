import { toApiError } from '@/lib/api-error';

/**
 * P11.6 — one place that knows the difference between the two refusals a
 * generation can hit:
 *
 * - **402** is MONEY: the operation needs credits (P08). The answer is a
 *   top-up or an upgrade.
 * - **429** is TIME: the monthly allowance ran out (or a rate limiter
 *   fired). The answer is an upgrade (or the next reset).
 *
 * Both are upgrade-aware, and neither is reported as a bare failure.
 */

export const isCreditError = (error: unknown): boolean => {
    const apiError = toApiError(error, '');
    return apiError.status === 402 || apiError.code === 'TOKEN_INSUFFICIENT';
};

export const isQuotaError = (error: unknown): boolean => {
    const apiError = toApiError(error, '');
    return (
        apiError.status === 429 ||
        apiError.code === 'QUOTA_EXHAUSTED' ||
        apiError.code === 'RATE_LIMITED'
    );
};

/** The message a toast should carry for a failed generation. */
export const generationErrorMessage = (error: unknown, fallback: string): string => {
    const apiError = toApiError(error, fallback);
    if (isCreditError(error)) {
        return `${apiError.message} Top up or upgrade in Billing to continue.`;
    }
    if (isQuotaError(error)) {
        return `${apiError.message} Upgrade for more generations.`;
    }
    return apiError.message;
};
