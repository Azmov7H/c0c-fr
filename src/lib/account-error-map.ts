/**
 * The account flows' error codes (AR-028).
 *
 * The API sends a stable `code` and an ENGLISH message. The code is data and
 * may be mapped to copy; the message is the upstream's text, not ours to
 * translate, so it travels as an `excerpt` and only appears when the map has no
 * sentence of its own.
 *
 * The keys below are `errors.*` entries shared by the `settings` and `billing`
 * catalogs, so the toast and the alert can render the same failure in either
 * language. Billing adds `notConfigured` (its 503 has a payment-specific
 * promise: "no payment was started") through the options.
 */
export type AccountErrorMessageKey =
    | 'rateLimit'
    | 'sessionExpired'
    | 'forbidden'
    | 'notFound'
    | 'invalidInput'
    | 'offline'
    | 'notConfigured'
    | 'server'
    | 'generic';

export interface AccountErrorShape {
    code?: string;
    message?: string;
    status?: number;
}

export interface MappedAccountError {
    /** The `errors.<key>` entry the surface should show. */
    messageKey: AccountErrorMessageKey;
    /** The upstream message — DATA, only used when the map has no sentence. */
    excerpt?: string;
    /** The upstream status, for callers that need to branch copy. */
    status?: number;
}

export interface AccountErrorOptions {
    /** 503's key. Billing names the payment-specific promise; other flows use `server`. */
    serviceUnavailableKey?: AccountErrorMessageKey;
    /** The key for a failure the map does not recognise. */
    fallbackKey?: AccountErrorMessageKey;
}

const RATE_LIMIT_CODES = new Set(['TOO_MANY_REQUESTS', 'QUOTA_EXHAUSTED', 'RATE_LIMITED']);
const SESSION_CODES = new Set(['UNAUTHORIZED', 'TOKEN_EXPIRED', 'TOKEN_INVALID', 'NO_TOKEN']);
const FORBIDDEN_CODES = new Set(['FORBIDDEN']);
const NOT_FOUND_CODES = new Set(['NOT_FOUND']);
const INVALID_CODES = new Set(['BAD_REQUEST', 'VALIDATION_ERROR']);
const UNAVAILABLE_CODES = new Set(['SERVICE_UNAVAILABLE', 'BILLING_NOT_CONFIGURED']);

export function mapAccountError(
    error: AccountErrorShape | null | undefined,
    options: AccountErrorOptions = {}
): MappedAccountError {
    const fallbackKey = options.fallbackKey ?? 'generic';
    if (!error) return { messageKey: fallbackKey };

    const { code, status } = error;

    // `toApiError` uses status 0 for a transport failure (no response at all)
    // and for a thrown non-ApiError, which is what the old copy treated as
    // "offline". Keep that meaning exactly.
    if (status === 0) {
        return { messageKey: 'offline', status };
    }

    if (
        status === 429 ||
        (code !== undefined && RATE_LIMIT_CODES.has(code))
    ) {
        return { messageKey: 'rateLimit', status };
    }

    if (status === 503 || (code !== undefined && UNAVAILABLE_CODES.has(code))) {
        return {
            messageKey: options.serviceUnavailableKey ?? 'server',
            status,
        };
    }

    if (status === 401 || (code !== undefined && SESSION_CODES.has(code))) {
        return { messageKey: 'sessionExpired', status };
    }

    if (status === 403 || (code !== undefined && FORBIDDEN_CODES.has(code))) {
        return { messageKey: 'forbidden', status };
    }

    if (status === 404 || (code !== undefined && NOT_FOUND_CODES.has(code))) {
        return { messageKey: 'notFound', status };
    }

    if (
        status === 400 ||
        status === 422 ||
        (code !== undefined && INVALID_CODES.has(code))
    ) {
        return { messageKey: 'invalidInput', status };
    }

    if (status !== undefined && status >= 500) {
        return { messageKey: 'server', status };
    }

    const excerpt = typeof error.message === 'string' && error.message.length > 0
        ? error.message
        : undefined;

    return { messageKey: fallbackKey, excerpt, status };
}

/**
 * The sentence to show: the mapped catalog line, except for a failure the map
 * does not recognise, where the upstream detail is all the user has.
 */
export function accountErrorMessage(
    t: (key: `errors.${AccountErrorMessageKey}`) => string,
    mapped: MappedAccountError
): string {
    if (mapped.messageKey === 'generic' && mapped.excerpt) {
        return mapped.excerpt;
    }
    return t(`errors.${mapped.messageKey}`);
}
