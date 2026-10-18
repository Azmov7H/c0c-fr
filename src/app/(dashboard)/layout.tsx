import { AppProviders } from '@/components/app-providers';
import { AppShell } from '@/components/layout/app-shell';
import { EmailVerificationBanner } from '@/features/auth/components/email-verification-banner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppProviders>
      <AppShell>
        <EmailVerificationBanner />
        {children}
      </AppShell>
    </AppProviders>
  );
}
