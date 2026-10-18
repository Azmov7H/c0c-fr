import { NextResponse, type NextRequest } from 'next/server';
import { z, type ZodType } from 'zod';

/**
 * Shared guards for the BFF auth routes (T09 / R-25).
 *
 * These routes sit on the boundary between an untrusted browser and the
 * backend's allowlists; they validate before proxying so junk never gets a
 * round trip and the user gets a field-level error instead of a proxy 400.
 */

/** Auth bodies are a few hundred bytes; 64 KB is already 100× headroom. */
const MAX_AUTH_BODY_BYTES = 64 * 1024;

export function methodNotAllowed(allow: string[]): NextResponse {
    return NextResponse.json(
        {
            success: false,
            error: {
                code: 'METHOD_NOT_ALLOWED',
                message: `Method not allowed. Allowed: ${allow.join(', ')}.`,
            },
        },
        { status: 405, headers: { Allow: allow.join(', ') } }
    );
}

/**
 * Content-Length pre-check so a huge body is rejected before it is read or
 * proxied. The backend's ceiling (10 MB express.json) is not a budget the BFF
 * should grant on routes that only ever carry credentials.
 */
export function enforceAuthBodyLimit(request: NextRequest): NextResponse | null {
    const raw = request.headers.get('content-length');
    const length = raw ? Number(raw) : 0;

    if (Number.isFinite(length) && length > MAX_AUTH_BODY_BYTES) {
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'PAYLOAD_TOO_LARGE',
                    message: `Request body too large (limit ${MAX_AUTH_BODY_BYTES} bytes).`,
                },
            },
            { status: 413 }
        );
    }

    return null;
}

type ValidationResult<S extends ZodType> =
    | { ok: true; data: z.infer<S> }
    | { ok: false; response: NextResponse };

/**
 * Parses the JSON body and validates it against a strict schema. Unknown keys
 * are rejected — the backend allowlists, but the BFF should not forward junk.
 * Errors use the same envelope the client already maps
 * (`{ success: false, error: { code, message, details } }`).
 */
export async function readValidatedJson<S extends ZodType>(
    request: NextRequest,
    schema: S
): Promise<ValidationResult<S>> {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return {
            ok: false,
            response: NextResponse.json(
                {
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: 'Request body must be valid JSON.' },
                },
                { status: 400 }
            ),
        };
    }

    const result = schema.safeParse(body);
    if (!result.success) {
        return {
            ok: false,
            response: NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Request failed validation.',
                        details: result.error.issues.map((issue) => ({
                            path: issue.path.join('.'),
                            message: issue.message,
                        })),
                    },
                },
                { status: 400 }
            ),
        };
    }

    return { ok: true, data: result.data };
}
