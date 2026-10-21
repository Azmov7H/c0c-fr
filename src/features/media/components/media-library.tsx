'use client';

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
import { formatRelativeTime } from '@/lib/relative-time';

const ICONS = {
    image: ImageIcon,
    video: Video,
    audio: FileAudio,
    document: Search,
} as const;

export function MediaLibrary() {
    const projects = useProjects({ limit: 100 });
    const [projectId, setProjectId] = useState('');
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState('all');

    const activeProjectId = projectId || projects.data?.data[0]?._id || '';
    const media = useProjectMedia(activeProjectId);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return (media.data?.data ?? []).filter((item) => {
            const matchesSearch =
                !term ||
                item.title.toLowerCase().includes(term) ||
                item.tags?.some((tag) => tag.toLowerCase().includes(term));
            return matchesSearch && (tab === 'all' || item.category === tab);
        });
    }, [media.data, search, tab]);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Media library"
                description="Every generated or attached asset for the selected project."
                actions={
                    <Button className="h-11" disabled title="Uploads need a storage provider, which is not configured yet.">
                        <Upload className="mr-2 size-4" aria-hidden="true" />
                        Upload
                    </Button>
                }
            />

            <div className="max-w-sm space-y-2">
                <Select value={activeProjectId} onValueChange={setProjectId}>
                    <SelectTrigger className="h-11" aria-label="Project">
                        <SelectValue placeholder="Choose a project" />
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
                    Uploads are disabled until a storage provider is connected.
                </p>
            </div>

            <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search assets..."
                filters={[]}
                onClear={() => {
                    setSearch('');
                    setTab('all');
                }}
            />

            <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="image">Images</TabsTrigger>
                    <TabsTrigger value="video">Videos</TabsTrigger>
                    <TabsTrigger value="audio">Audio</TabsTrigger>
                    <TabsTrigger value="document">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value={tab} className="mt-6">
                    {media.isLoading ? (
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6" role="status" aria-label="Loading media">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <Skeleton key={index} className="aspect-square rounded-xl" />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <EmptyState
                            icon={search || tab !== 'all' ? Search : Upload}
                            title={search || tab !== 'all' ? 'No assets found' : 'No media yet'}
                            description={
                                search || tab !== 'all'
                                    ? 'Try adjusting your search or filters.'
                                    : 'Generated media from your projects will appear here.'
                            }
                        />
                    ) : (
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
                            {filtered.map((item) => {
                                const Icon = ICONS[item.category] ?? ImageIcon;
                                return (
                                    <Card key={item._id} className="overflow-hidden">
                                        <CardContent className="p-0">
                                            <div className="flex aspect-square items-center justify-center bg-muted/40">
                                                {item.thumbnailUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={item.thumbnailUrl} alt="" className="size-full object-cover" />
                                                ) : (
                                                    <Icon className="size-10 text-muted-foreground/50" aria-hidden="true" />
                                                )}
                                            </div>
                                            <div className="space-y-1 p-3">
                                                <p className="truncate text-xs font-medium">{item.title}</p>
                                                <div className="flex items-center justify-between">
                                                    <Badge variant="secondary" className="text-[10px]">{item.category}</Badge>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {formatRelativeTime(item.createdAt).relative}
                                                    </span>
                                                </div>
                                            </div>
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
