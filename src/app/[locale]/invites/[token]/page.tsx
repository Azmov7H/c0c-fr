import { InviteLanding } from '@/features/projects/components/invite-landing';

export default async function InvitePage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;
    return <InviteLanding token={token} />;
}
