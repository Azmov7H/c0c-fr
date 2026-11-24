'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ADMIN_ROLES, adminRoleLabelKey } from '@/features/admin/lib/permissions';

/**
 * Users filters (spec §4.2): search + role. The page is server-rendered; the
 * bar re-issues `router.push` with the query params so the server refetches
 * (spec §5.1 rule 6 analog — search updates the list).
 */
export function UsersFilterBar() {
    const t = useTranslations('admin');
    const router = useRouter();
    const searchParams = useSearchParams();
    const [draft, setDraft] = useState(searchParams.get('q') ?? '');
    const role = searchParams.get('role') ?? '';

    const pushQuery = (updates: Array<[string, string | null]>) => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('page');
        for (const [key, value] of updates) {
            if (value) params.set(key, value);
            else params.delete(key);
        }
        void router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Label htmlFor="users-search" className="sr-only">
                {t('pages.users.filters.search')}
            </Label>
            <Input
                id="users-search"
                value={draft}
                placeholder={t('pages.users.filters.search')}
                className="w-56"
                onChange={(event) => setDraft(event.target.value)}
            />
            <Button size="sm" onClick={() => pushQuery([['q', draft.trim()]])}>
                {t('pages.users.filters.search')}
            </Button>
            <Select value={role} onValueChange={(value) => pushQuery([['role', value]])}>
                <SelectTrigger aria-label={t('pages.users.filters.role')} className="w-44">
                    <SelectValue placeholder={t('pages.users.filters.all')} />
                </SelectTrigger>
                <SelectContent>
                    {ADMIN_ROLES.map((roleValue) => (
                        <SelectItem key={roleValue} value={roleValue}>
                            {t(adminRoleLabelKey(roleValue))}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
