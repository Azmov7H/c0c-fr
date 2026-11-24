'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { DataState } from '@/components/shared/data-state';
import { PageHeader } from '@/components/shared/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { can } from '@/features/projects/lib/permissions';
import { useProjectMembers } from '@/features/projects/hooks/use-collaboration';
import type { ProjectRole } from '@/features/projects/types';
import { useAuthStore } from '@/store/auth-store';

import { useAdvertisement } from '../hooks/use-advertisements';
import { VideoPipeline } from './video-pipeline';

export function AdvertisementDetail() {
    const t = useTranslations('advertisements');
    const params = useParams<{ id: string }>();
    const id = params?.id ?? '';
    const currentUserId = useAuthStore((state) => state.user?.id ?? '');
    const detail = useAdvertisement(id);
    const members = useProjectMembers(detail.data?.project.id ?? '');

    const data = members.data;
    const role: ProjectRole =
        data?.owner.userId === currentUserId
            ? 'owner'
            : data?.members.find((member) => member.userId === currentUserId)?.role ?? 'viewer';

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('pageHeader.title')}
                description={t('pageHeader.description')}
            />
            <DataState
                isLoading={detail.isLoading}
                error={detail.isError ? detail.error : undefined}
                isEmpty={!detail.data}
                emptyTitle={t('detail.loadError')}
                emptyDescription={t('detail.notInitialized')}
                onRetry={() => void detail.refetch()}
                loadingFallback={
                    <div className="space-y-4" role="status" aria-label={t('list.loading')}>
                        <Skeleton className="h-32 w-full rounded-xl" />
                        <Skeleton className="h-64 w-full rounded-xl" />
                    </div>
                }
            >
                {detail.data ? (
                    <VideoPipeline
                        detail={detail.data}
                        canEdit={can(role, 'edit')}
                        showBackLink
                    />
                ) : null}
            </DataState>
        </div>
    );
}
