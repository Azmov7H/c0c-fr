'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { AdminActionDialog } from './admin-action-dialog';
import { ReasonField } from './reason-field';
import type { AdminUserRow } from '@/features/admin/services/users.admin.service';

interface SuspensionDialogProps {
    open: boolean;
    onClose: () => void;
    user: AdminUserRow;
    /** Suspend/restore callbacks from `UsersTable.run` (error path handled there). */
    onSuspend?: (body: { reason?: string }) => void;
    onRestore?: (body: { reason?: string }) => void;
}

const displayNameOf = (user: AdminUserRow): string =>
    `${user.firstName} ${user.lastName}`.trim() || user.email;

export function UserSuspendDialog({ open, onClose, user, onSuspend }: SuspensionDialogProps) {
    const t = useTranslations('admin');
    const [reason, setReason] = useState('');
    const displayName = displayNameOf(user);
    return (
        <AdminActionDialog
            open={open}
            onOpenChange={onClose}
            title={t('pages.users.dialogs.suspend.title', { user: displayName })}
            description={t('pages.users.dialogs.suspend.description', { user: displayName })}
            consequence={t('pages.users.dialogs.suspend.consequence')}
            submitLabel={t('pages.users.dialogs.suspend.confirm')}
            onSubmit={() => onSuspend?.({ reason: reason.trim() || undefined })}
            requiresStepUp
        >
            <ReasonField value={reason} onChange={setReason} label={t('pages.users.dialogs.suspend.reasonLabel')} required />
        </AdminActionDialog>
    );
}

export function UserRestoreDialog({ open, onClose, user, onRestore }: SuspensionDialogProps) {
    const t = useTranslations('admin');
    const [reason, setReason] = useState('');
    const displayName = displayNameOf(user);
    return (
        <AdminActionDialog
            open={open}
            onOpenChange={onClose}
            title={t('pages.users.dialogs.restore.title', { user: displayName })}
            description={t('pages.users.dialogs.restore.description', { user: displayName })}
            consequence={t('pages.users.dialogs.restore.consequence')}
            submitLabel={t('pages.users.dialogs.restore.confirm')}
            onSubmit={() => onRestore?.({ reason: reason.trim() || undefined })}
            requiresStepUp
        >
            <ReasonField value={reason} onChange={setReason} label={t('pages.users.dialogs.restore.reasonLabel')} />
        </AdminActionDialog>
    );
}
