export interface ApiErrorParams {
    code: string;
    message: string;
    status?: number;
    details?: unknown;
}

export class ApiError extends Error {
    readonly code: string;
    readonly status?: number;
    readonly details?: unknown;

    constructor({ code, message, status, details }: ApiErrorParams) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.status = status;
        this.details = details;
    }
}

interface ApiErrorEnvelope {
    error?: { message?: string; code?: string };
}

interface ApiErrorResponse {
    response?: { data?: ApiErrorEnvelope };
}

/**
 * Normalises anything thrown by the API layer into an ApiError so callers never
 * have to narrow `unknown` by hand. Reads the backend's
 * `{ success: false, error: { code, message } }` envelope, then the axios
 * message, then falls back to the caller's own wording.
 */
export function toApiError(error: unknown, fallbackMessage: string): ApiError {
    if (error instanceof ApiError) return error;

    if (error instanceof Error) {
        return new ApiError({
            code: 'UNEXPECTED_ERROR',
            message: error.message || fallbackMessage,
            status: 0,
        });
    }

    const { data } = (error as ApiErrorResponse)?.response ?? {};
    const message = data?.error?.message ?? data?.error?.code;

    return new ApiError({
        code: data?.error?.code ?? 'UNEXPECTED_ERROR',
        message: message || fallbackMessage,
        status: 0,
    });
}
