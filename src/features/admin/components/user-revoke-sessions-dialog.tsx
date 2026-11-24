'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { AdminActionDialog } from './admin-action-dialog';
import { ReasonField } from './reason-field';
import type { AdminUserRow } from '@/features/admin/services/users.admin.service';

export function UserRevokeSessionsDialog({
    open,
    onClose,
    user,
    onRevoke,
}: {
    open: boolean;
    onClose: () => void;
    user: AdminUserRow;
    onRevoke: () => void;
}) {
    const t = useTranslations('admin');
    const [reason, setReason] = useState('');
    const displayName = `${user.firstName} ${user.lastName}`.trim() || user.email;
    return (
        <AdminActionDialog
            open={open}
            onOpenChange={onClose}
            title={t('pages.users.dialogs.revokeSessions.title', { user: displayName })}
            description={t('pages.users.dialogs.revokeSessions.description', { user: displayName })}
            consequence={t('pages.users.dialogs.revokeSessions.consequence')}
            submitLabel={t('pages.users.dialogs.revokeSessions.confirm')}
            onSubmit={onRevoke}
        >
            <ReasonField value={reason} onChange={setReason} label={t('pages.users.dialogs.revokeSessions.reasonLabel')} />
        </AdminActionDialog>
    );
}
