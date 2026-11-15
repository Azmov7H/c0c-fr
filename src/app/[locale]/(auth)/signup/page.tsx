import { SignupForm } from '@/features/auth/components/signup-form';

/**
 * Canonical signup route (T12). `/register` 301s here — see
 * src/app/(auth)/register/route.ts.
 */
export default function SignupPage() {
    return <SignupForm />;
}
