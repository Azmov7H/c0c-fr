/**
 * Maps request failures to the message a form shows.
 *
 * Rules encoded here, one place so no form can accidentally undo them:
 *   - 429 gets a rate-limit-specific message, never a generic "failed".
 *   - 401 in a login context is ALWAYS the generic credential message — the
 *     UI must never confirm whether an account exists (AUTH-05).
 *   - 5xx/network failures surface the support reference the BFF attached;
 *     4xx are the user's to fix and carry no reference.
 *
 * AR-026: the map does not produce SENTENCES any more — it produces the KEY
 * of the message the form owns (`errors.<key>` in the catalog), and the
 * form translates it. An upstream message is passed through as DATA
 * (`excerpt`): the API's own text is not ours to translate.
 */
export interface AuthRequestErrorShape {
    message?: string;
    code?: string;
    status?: number;
    reference?: string;
    response?: { data?: { error?: { message?: string; code?: string; reference?: string } } };
}

/**
 * The catalog keys of the messages the auth forms own.
 *
 * They are the `errors.*` entries of `messages/{en,ar}/auth.json`.
 */
export type AuthErrorMessageKey =
    | 'rateLimit'
    | 'invalidCredentials'
    | 'server'
    | 'loginFallback'
    | 'signupFallback'
    | 'forgotFallback'
    | 'resetFallback'
    | 'changeFallback'
    | 'verifyFallback';

export interface MappedAuthError {
    /** The catalog key of the message the form owns. */
    messageKey: AuthErrorMessageKey;
    /**
     * The upstream message — DATA (the API's own text), when it sent one and
     * the form has no message of its own for the case.
     */
    excerpt?: string;
    reference?: string;
    /** Upstream status, for callers that need to branch copy (e.g. reset 400). */
    status?: number;
}

export function mapAuthError(
    error: AuthRequestErrorShape | null | undefined,
    fallbackKey: AuthErrorMessageKey,
    options: { unauthorizedKey?: AuthErrorMessageKey } = {}
): MappedAuthError {
    if (!error) return { messageKey: fallbackKey };

    const status = error.status;
    const code = error.code ?? error.response?.data?.error?.code;
    const reference = error.reference ?? error.response?.data?.error?.reference;

    if (status === 429 || code === 'TOO_MANY_REQUESTS') {
        return { messageKey: 'rateLimit', status };
    }

    if (status === 401) {
        // AUTH-05: the login context names the generic message and never the
        // excerpt — the UI must not confirm whether an account exists.
        if (options.unauthorizedKey) {
            return { messageKey: options.unauthorizedKey, status };
        }
        return { messageKey: fallbackKey, excerpt: excerpt(error) ?? undefined, status };
    }

    if (typeof status === 'number' && status >= 500) {
        return {
            messageKey: 'server',
            reference,
            status,
        };
    }

    return { messageKey: fallbackKey, excerpt: excerpt(error) ?? undefined, reference, status };
}

function excerpt(error: AuthRequestErrorShape): string | null {
    const message = error.response?.data?.error?.message || error.message;
    return typeof message === 'string' && message.length > 0 ? message : null;
}
