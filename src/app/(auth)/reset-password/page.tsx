import { Suspense } from 'react';

import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';

export default function ResetPasswordPage() {
    // ResetPasswordForm reads the one-time token from search params and scrubs
    // it from the URL on mount.
    return (
        <Suspense>
            <ResetPasswordForm />
        </Suspense>
    );
}
