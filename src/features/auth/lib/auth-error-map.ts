/**
 * Maps request failures to human messages for the auth forms (T12).
 *
 * Rules encoded here, one place so no form can accidentally undo them:
 *   - 429 gets a rate-limit-specific message, never a generic "failed".
 *   - 401 in a login context is ALWAYS the generic credential message — the
 *     UI must never confirm whether an account exists (AUTH-05).
 *   - 5xx/network failures surface the support reference the BFF attached;
 *     4xx are the user's to fix and carry no reference.
 */
export interface AuthRequestErrorShape {
    message?: string;
    code?: string;
    status?: number;
    reference?: string;
    response?: { data?: { error?: { message?: string; code?: string; reference?: string } } };
}

export interface MappedAuthError {
    message: string;
    reference?: string;
    /** Upstream status, for callers that need to branch copy (e.g. reset 400). */
    status?: number;
}

export const LOGIN_GENERIC_ERROR = 'Invalid email or password.';
export const RATE_LIMIT_ERROR = 'Too many attempts. Please wait a minute and try again.';

export function mapAuthError(
    error: AuthRequestErrorShape | null | undefined,
    fallback: string,
    options: { unauthorizedMessage?: string } = {}
): MappedAuthError {
    if (!error) return { message: fallback };

    const status = error.status;
    const code = error.code ?? error.response?.data?.error?.code;
    const reference = error.reference ?? error.response?.data?.error?.reference;

    if (status === 429 || code === 'TOO_MANY_REQUESTS') {
        return { message: RATE_LIMIT_ERROR, status };
    }

    if (status === 401) {
        return { message: options.unauthorizedMessage ?? excerpt(error) ?? fallback, status };
    }

    if (typeof status === 'number' && status >= 500) {
        return {
            message: 'Something went wrong on our side. Please try again.',
            reference,
            status,
        };
    }

    return { message: excerpt(error) ?? fallback, reference, status };
}

function excerpt(error: AuthRequestErrorShape): string | null {
    const message = error.response?.data?.error?.message || error.message;
    return typeof message === 'string' && message.length > 0 ? message : null;
}
