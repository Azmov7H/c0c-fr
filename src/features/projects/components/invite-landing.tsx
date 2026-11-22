'use client';

import { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Loader2, MailX, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/auth-store';
import { projectInvitesService } from '../services/collaboration.service';
import { roleDescription, roleLabel } from '../lib/projects-labels';

export function InviteLanding({ token }: { token: string }) {
    const t = useTranslations('projects');
    const router = useRouter();
    const authenticated = useAuthStore((state) => state.isAuthenticated);
    const preview = useQuery({
        queryKey: ['project-invite-preview', token],
        queryFn: () => projectInvitesService.preview(token),
        retry: false,
    });
    const accept = useMutation({
        mutationFn: () => projectInvitesService.accept(token),
    });

    // The success state is shown briefly so the user knows what happened, then the
    // journey continues into the project instead of dead-ending on a confirmation.
    useEffect(() => {
        if (!accept.isSuccess) return;
        const projectId = accept.data.projectId;
        const timer = window.setTimeout(() => router.push(`/projects/${projectId}`), 1200);
        return () => window.clearTimeout(timer);
    }, [accept.isSuccess, accept.data, router]);

    if (preview.isLoading) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="mt-2 h-4 w-56" />
                </CardHeader>
                <CardContent className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-11 w-full" />
                </CardContent>
            </Card>
        );
    }

    // Expired, revoked, unknown, already accepted and wrong recipient all land
    // here with the same copy. Distinguishing them would confirm the token was
    // once real — the API deliberately does not.
    if (preview.isError || !preview.data) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader className="items-center text-center">
                    <MailX className="mb-2 size-10 text-muted-foreground" aria-hidden="true" />
                    <CardTitle>{t('invite.unavailableTitle')}</CardTitle>
                    <CardDescription>{t('invite.invalidCopy')}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                    <Button asChild className="h-11">
                        <Link href="/login">{t('invite.signIn')}</Link>
                    </Button>
                    <Button asChild variant="outline" className="h-11">
                        <Link href="/projects">{t('invite.goToProjects')}</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const invite = preview.data;
    const days = Math.max(1, Math.ceil(invite.expiresIn / 86_400));
    const acceptError = accept.error
        ? (accept.error as { status?: number; code?: string })
        : undefined;
    const alreadyMember = acceptError?.status === 409;

    if (accept.isSuccess) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader className="items-center text-center">
                    <CheckCircle2 className="mb-2 size-10 text-success" aria-hidden="true" />
                    <CardTitle>{t('invite.youAreInTitle')}</CardTitle>
                    <CardDescription>
                        {t('invite.joinedDescription', {
                            project: `“${invite.projectName}”`,
                            role: roleLabel(t, invite.role).toLowerCase(),
                        })}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        className="h-11 w-full"
                        onClick={() => router.push(`/projects/${accept.data.projectId}`)}
                    >
                        {t('invite.openProject')}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (alreadyMember) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader className="items-center text-center">
                    <Users className="mb-2 size-10 text-primary" aria-hidden="true" />
                    <CardTitle>{t('invite.alreadyMemberTitle')}</CardTitle>
                    <CardDescription>
                        {t('invite.alreadyMemberDescription', {
                            project: `“${invite.projectName}”`,
                        })}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="h-11 w-full">
                        <Link href="/projects">{t('invite.openYourProjects')}</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>{t('invite.joinTitle', { project: `“${invite.projectName}”` })}</CardTitle>
                <CardDescription>
                    {t('invite.joinDescription', {
                        inviter: invite.inviterName,
                        role: roleLabel(t, invite.role).toLowerCase(),
                        description: roleDescription(t, invite.role),
                    })}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    {t('invite.expiresIn', { count: days })}
                </p>

                {accept.isError && !alreadyMember && (
                    <p className="text-sm text-destructive" role="alert">
                        {t('invite.invalidCopy')}
                    </p>
                )}

                {authenticated ? (
                    <Button
                        className="h-11 w-full"
                        disabled={accept.isPending}
                        onClick={() => accept.mutate()}
                    >
                        {accept.isPending && <Loader2 className="me-2 size-4 animate-spin" aria-hidden="true" />}
                        {t('invite.accept')}
                    </Button>
                ) : (
                    <div className="space-y-2">
                        <Button asChild className="h-11 w-full">
                            <Link href={`/login?callbackUrl=${encodeURIComponent(`/invites/${token}`)}`}>
                                {t('invite.signInToAccept')}
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="h-11 w-full">
                            <Link href={`/signup?callbackUrl=${encodeURIComponent(`/invites/${token}`)}`}>
                                {t('invite.createAccount')}
                            </Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
