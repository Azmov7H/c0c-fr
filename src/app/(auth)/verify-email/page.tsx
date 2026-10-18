import { Suspense } from 'react';

import { VerifyEmailPanel } from '@/features/auth/components/verify-email-panel';

export default function VerifyEmailPage() {
    // VerifyEmailPanel reads the token from search params and scrubs it from
    // the URL on mount.
    return (
        <Suspense>
            <VerifyEmailPanel />
        </Suspense>
    );
}
