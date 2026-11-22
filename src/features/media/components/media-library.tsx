'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { AppLocale } from '@/i18n/routing';
import { useMemo, useState } from 'react';
import { FileAudio, Image as ImageIcon, Search, Upload, Video } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { FilterBar } from '@/components/shared/filter-bar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useProjectMedia } from '@/features/media/hooks/use-media';
import { useProjects } from '@/features/projects/hooks/use-projects';
import { UnsplashAttribution } from '@/features/images/components/unsplash-attribution';
import { unsplashMetadataOf } from '@/features/images/types';
import { formatRelativeTime } from '@/lib/relative-time';

export function MediaLibrary() {
    const t = useTranslations('media');
    const locale = useLocale();
    const projects = useProjects();
    const [projectId, setProjectId] = useState('');
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState('all');
    const { data, isLoading } = useProjectMedia(projectId);

    const items = useMemo(() => data?.data ?? [], [data]);
    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        return items.filter((item) => {
            const tabMatch = tab === 'all' || item.category === tab;
            const queryMatch =
                !query ||
                item.title.toLowerCase().includes(query) ||
                (item.tags ?? []).some((tag) => tag.toLowerCase().includes(query));
            return tabMatch && queryMatch;
        });
    }, [items, search, tab]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader
                title={t('library.title')}
                description={t('library.description')}
                actions={
                    <Button disabled title={t('library.uploadDisabledTitle')}>
                        <Upload className="me-2 h-4 w-4" />
                        {t('library.upload')}
                    </Button>
                }
            />

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger className="w-full md:w-[260px]" aria-label={t('library.projectAria')}>
                        <SelectValue placeholder={t('library.projectPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                        {(projects.data?.data ?? []).map((project) => (
                            <SelectItem key={project._id} value={project._id}>
                                {project.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                    {t('library.uploadsDisabled')}
                </p>
            </div>

            <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder={t('library.searchPlaceholder')}
                filters={[]}
            />

            <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                    <TabsTrigger value="all">{t('library.tabs.all')}</TabsTrigger>
                    <TabsTrigger value="images">{t('library.tabs.images')}</TabsTrigger>
                    <TabsTrigger value="videos">{t('library.tabs.videos')}</TabsTrigger>
                    <TabsTrigger value="audio">{t('library.tabs.audio')}</TabsTrigger>
                    <TabsTrigger value="documents">{t('library.tabs.documents')}</TabsTrigger>
                </TabsList>
                <TabsContent value={tab} className="mt-4">
                    {isLoading ? (
                        <div
                            className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
                            aria-busy="true"
                            aria-label={t('library.loading')}
                        >
                            {Array.from({ length: 8 }).map((_, i) => (
                                <Skeleton key={i} className="h-52 rounded-xl" />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <EmptyState
                            icon={Search}
                            title={search ? t('library.emptyFoundTitle') : t('library.emptyTitle')}
                            description={
                                search
                                    ? t('library.emptyFoundDescription')
                                    : t('library.emptyDescription')
                            }
                        />
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {filtered.map((item) => {
                                const Icon =
                                    item.category === 'image'
                                        ? ImageIcon
                                        : item.category === 'video'
                                            ? Video
                                            : item.category === 'audio'
                                                ? FileAudio
                                                : Search;
                                return (
                                    <Card key={item._id} className="overflow-hidden">
                                        <div className="flex h-28 items-center justify-center bg-muted/40">
                                            <Icon className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <CardContent className="space-y-2 p-3">
                                            <p className="truncate text-sm font-medium">{item.title}</p>
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <Badge variant="outline" className="text-[10px] capitalize">
                                                    {item.category}
                                                </Badge>
                                                <span>{formatRelativeTime(item.createdAt, locale as AppLocale).relative}</span>
                                            </div>
                                            {(() => {
                                                const u = unsplashMetadataOf(item.metadata as Record<string, unknown> | undefined);
                                                return u ? <UnsplashAttribution photo={u} /> : null;
                                            })()}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
