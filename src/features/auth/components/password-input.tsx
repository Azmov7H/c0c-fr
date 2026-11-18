'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Password input with a correctly-labelled visibility toggle (T12).
 * Spreads all props onto the underlying input, so it works inside
 * `<FormControl>` (the shadcn Slot forwards id / aria-* / refs).
 */
export function PasswordInput({ className, ...props }: React.ComponentProps<'input'>) {
    // AR-026: the toggle's label is copy.
    const t = useTranslations('auth');
    const [visible, setVisible] = React.useState(false);

    return (
        <div className="relative">
            <Input
                type={visible ? 'text' : 'password'}
                className={cn('pe-11', className)}
                {...props}
            />
            <button
                type="button"
                onClick={() => setVisible((value) => !value)}
                aria-label={visible ? t('password.hide') : t('password.show')}
                aria-pressed={visible}
                className="absolute inset-y-0 end-0 flex w-11 items-center justify-center rounded-r-xl text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                {visible ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                )}
            </button>
        </div>
    );
}
