'use client';

import type { ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

/**
 * `ReasonField` (spec §7.2): the 10–500 char textarea + counter used inside
 * mutation dialogs (§3.3, dialog step 3). Backend contracts: reasons are
 * `min(10).max(500)` on `POST /admin/credits/grant` etc.
 */
const REASON_MAX_LENGTH = 500;

export function ReasonField({
    value,
    onChange,
    disabled,
    label,
    required,
}: {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    /** Optional label override; defaults to the catalog's `Reason`. */
    label?: string;
    required?: boolean;
}) {
    const t = useTranslations('admin');
    const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        onChange(event.target.value.slice(0, REASON_MAX_LENGTH));
    };
    return (
        <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">
                {label ?? t('components.reasonField.label')}
                {required ? '*' : ''}
            </Label>
            <Textarea
                value={value}
                onChange={handleChange}
                maxLength={REASON_MAX_LENGTH}
                disabled={disabled}
                placeholder={t('components.reasonField.placeholder')}
                className="min-h-[84px]"
            />
            <p className="text-xs text-muted-foreground">
                {value.length}/{REASON_MAX_LENGTH}
            </p>
        </div>
    );
}
