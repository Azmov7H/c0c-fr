import { Suspense } from 'react';

import { LoginForm } from '@/features/auth/components/login-form';

export default function LoginPage() {
    // LoginForm reads search params (post-redirect notices) — Suspense keeps
    // the route statically prerenderable.
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    );
}
