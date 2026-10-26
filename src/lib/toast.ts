/**
 * T20: an in-house toast emitter instead of `sonner`.
 *
 * The app only ever calls `toast.success`, `toast.error` and `toast.info`, and
 * sonner ships ~10 kB gzip of positioning, queuing and swipe-dismiss runtime to
 * every authenticated route for that. This module is a ~1 kB event bus; the
 * rendering lives in `components/ui/toaster.tsx`.
 *
 * The `{ description }` option is preserved because the websocket bridge uses
 * it; unknown options are ignored rather than rejected so call sites did not
 * have to change shape.
 */
export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
    description?: string;
    duration?: number;
    id?: string;
}

export interface ToastItem {
    id: string;
    tone: ToastTone;
    message: string;
    description?: string;
    duration: number;
    dismissed?: boolean;
}

type Listener = (item: ToastItem) => void;

const listeners = new Set<Listener>();
let counter = 0;

const DEFAULT_DURATION = 4000;

function emit(tone: ToastTone, message: string, options: ToastOptions = {}): string {
    const item: ToastItem = {
        id: options.id ?? `toast-${++counter}`,
        tone,
        message,
        description: options.description,
        duration: options.duration ?? DEFAULT_DURATION,
    };
    for (const listener of listeners) listener(item);
    return item.id;
}

export const toast = {
    success: (message: string, options?: ToastOptions) => emit('success', message, options),
    error: (message: string, options?: ToastOptions) => emit('error', message, options),
    info: (message: string, options?: ToastOptions) => emit('info', message, options),
    warning: (message: string, options?: ToastOptions) => emit('warning', message, options),
    message: (message: string, options?: ToastOptions) => emit('info', message, options),
    dismiss: (id?: string) => {
        const item: ToastItem = { id: id ?? '', tone: 'info', message: '', duration: 0, dismissed: true };
        for (const listener of listeners) listener(item);
    },
};

/** Internal: the Toaster subscribes on mount. */
export function subscribeToToasts(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
