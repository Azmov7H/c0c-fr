'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import apiClient from '@/services/api-client';
import type { ApiResponse } from '@/services/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSetStepUpToken } from '../lib/step-up-context';

/**
 * Password prompt for a fresh step-up token (spec §3.3, dialog step 5 and
 * spec §5.1 rule 5). Calls `POST /api/v1/admin/auth/step-up`; on success the
 * token goes into the step-up context (memory only) and `onMinted` fires so
 * the parent can unlock the confirm action.
 */
export function StepUpPrompt({
    onMinted,
}: {
    onMinted?: () => void;
}) {
    const t = useTranslations('admin');
    const setToken = useSetStepUpToken();
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const confirm = async () => {
        setSubmitting(true);
        setError(null);
        try {
            const response = await apiClient.post<
                ApiResponse<{ stepUp: true; token: string; expiresAt: string }>
            >('/admin/auth/step-up', { password });
            setToken(response.data.data.token);
            setPassword('');
            onMinted?.();
        } catch {
            setError(t('components.stepUpPrompt.invalid'));
            setPassword('');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-2 rounded-md border border-border/80 p-3">
            <Label className="text-sm font-medium">{t('components.stepUpPrompt.password')}</Label>
            <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                    setPassword(event.target.value);
                    if (error) setError(null);
                }}
                disabled={submitting}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' && password.length > 0) void confirm();
                }}
            />
            {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
            <Button
                size="sm"
                disabled={submitting || password.length === 0}
                onClick={() => void confirm()}
            >
                {t('components.stepUpPrompt.confirm')}
            </Button>
            <p className="text-xs text-muted-foreground">{t('components.stepUpPrompt.hint')}</p>
        </div>
    );
}
