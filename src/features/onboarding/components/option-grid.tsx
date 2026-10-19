'use client';

import * as React from 'react';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface OptionItem {
    value: string;
    label: string;
}

interface OptionGridProps {
    options: OptionItem[];
    selected: string[];
    onToggle: (value: string) => void;
    mode: 'single' | 'multiple';
    /** Accessible group name — announced before the options. */
    label: string;
    columns?: 1 | 2 | 3;
    /** Options beyond the cap are shown disabled with the reason in the hint. */
    max?: number;
    disabled?: boolean;
}

const COLUMN_CLASS: Record<1 | 2 | 3, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
};

/**
 * A selection control built from real buttons.
 *
 * `role="radio"`/`role="checkbox"` with `aria-checked` means the selected state
 * is announced and the control behaves for keyboard and screen-reader users
 * like the native input it replaces, while keeping >=44px touch targets and the
 * larger click area that native radios lose inside a card layout.
 */
export function OptionGrid({
    options,
    selected,
    onToggle,
    mode,
    label,
    columns = 2,
    max,
    disabled,
}: OptionGridProps) {
    const atMax = typeof max === 'number' && selected.length >= max;

    return (
        <div
            role={mode === 'single' ? 'radiogroup' : 'group'}
            aria-label={label}
            className={cn('grid gap-2', COLUMN_CLASS[columns])}
        >
            {options.map((option) => {
                const isSelected = selected.includes(option.value);
                const isBlocked = !isSelected && atMax;

                return (
                    <button
                        key={option.value}
                        type="button"
                        role={mode === 'single' ? 'radio' : 'checkbox'}
                        aria-checked={isSelected}
                        aria-disabled={isBlocked || disabled || undefined}
                        disabled={disabled || isBlocked}
                        onClick={() => onToggle(option.value)}
                        className={cn(
                            'min-h-11 w-full rounded-lg border p-3 text-left text-sm transition-colors',
                            'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                            'hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-50',
                            isSelected
                                ? 'border-primary bg-primary/10 text-foreground'
                                : 'border-border bg-card'
                        )}
                    >
                        <span className="flex items-center gap-2.5">
                            <span
                                aria-hidden="true"
                                className={cn(
                                    'flex size-5 shrink-0 items-center justify-center border',
                                    mode === 'single' ? 'rounded-full' : 'rounded-[4px]',
                                    isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'
                                )}
                            >
                                {isSelected ? <Check className="size-3.5" /> : null}
                            </span>
                            <span className="font-medium">{option.label}</span>
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
