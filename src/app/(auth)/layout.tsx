import { AppProviders } from '@/components/app-providers';

/**
 * Auth pages are data-shaped: login/register mutations go through react-query
 * and SessionInitializer handles the "already signed in" redirect client-side
 * (the middleware covers document loads). See theme-provider.tsx for the
 * provider split rationale.
 */
export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AppProviders>{children}</AppProviders>;
}
