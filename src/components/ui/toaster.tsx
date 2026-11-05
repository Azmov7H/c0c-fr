'use client';

import * as React from 'react';
import { CheckCircle2, Info, TriangleAlert, XCircle } from 'lucide-react';

import { subscribeToToasts, type ToastItem } from '@/lib/toast';

const TONE: Record<ToastItem['tone'], { icon: typeof Info; className: string }> = {
    success: { icon: CheckCircle2, className: 'text-success' },
    error: { icon: XCircle, className: 'text-destructive' },
    info: { icon: Info, className: 'text-info' },
    warning: { icon: TriangleAlert, className: 'text-warning' },
};

/**
 * Renders the toasts emitted by `lib/toast`. Mounted once in AppProviders.
 * `aria-live` is polite: these confirm completed work, they never gate it.
 */
export function Toaster() {
    const [items, setItems] = React.useState<ToastItem[]>([]);

    React.useEffect(() => {
        const timers = new Map<string, ReturnType<typeof setTimeout>>();

        const unsubscribe = subscribeToToasts((item) => {
            if (item.dismissed) {
                setItems((current) => current.filter((toast) => toast.id !== item.id));
                return;
            }

            setItems((current) => {
                const exists = current.some((toast) => toast.id === item.id);
                return exists ? current.map((toast) => (toast.id === item.id ? item : toast)) : [...current, item];
            });

            const existing = timers.get(item.id);
            if (existing) clearTimeout(existing);
            timers.set(
                item.id,
                setTimeout(() => {
                    setItems((current) => current.filter((toast) => toast.id !== item.id));
                    timers.delete(item.id);
                }, item.duration)
            );
        });

        return () => {
            unsubscribe();
            for (const timer of timers.values()) clearTimeout(timer);
        };
    }, []);

    if (items.length === 0) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-full sm:max-w-sm"
        >
            {items.map((item) => {
                const { icon: Icon, className } = TONE[item.tone];
                return (
                    <div
                        key={item.id}
                        className="pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-lg"
                    >
                        <Icon className={`mt-0.5 size-4 shrink-0 ${className}`} aria-hidden="true" />
                        <div className="min-w-0">
                            <p className="text-sm font-semibold">{item.message}</p>
                            {item.description ? (
                                <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                            ) : null}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
