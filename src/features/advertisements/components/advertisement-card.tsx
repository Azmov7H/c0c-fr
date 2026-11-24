'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Clapperboard, Download, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useUrlLocale } from '@/i18n/locale';
import { getFormatters } from '@/lib/format';

import { languageLabel, statusLabel } from '../lib/labels';
import type { AdvertisementSummary } from '../types';

interface AdvertisementCardProps {
    advertisement: AdvertisementSummary;
    onArchive?: (id: string) => void;
    archivePending?: boolean;
    canArchive?: boolean;
}

export function AdvertisementCard({
    advertisement,
    onArchive,
    archivePending = false,
    canArchive = false,
}: AdvertisementCardProps) {
    const t = useTranslations('advertisements');
    const locale = useUrlLocale();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const formatters = getFormatters(locale);
    const relative = formatters.relative(advertisement.updatedAt);

    return (
        <Card className="group overflow-hidden">
            <Link
                href={`/advertisements/${advertisement.id}`}
                className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`${t('card.open')}: ${advertisement.projectTitle}`}
            >
                <div className="relative aspect-video overflow-hidden bg-muted">
                    {advertisement.posterUrl ? (
                        // Cloudinary posters are opaque signed URLs from the API;
                        // Next image optimization would re-host them without the
                        // render job's delivery contract.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={advertisement.posterUrl}
                            alt={advertisement.projectTitle}
                            loading="lazy"
                            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                    ) : (
                        <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
                            <Clapperboard className="size-8" aria-hidden="true" />
                            <span className="text-xs">{t('card.posterFallback')}</span>
                        </div>
                    )}
                    <Badge className="absolute end-3 top-3">{statusLabel(t, advertisement.status)}</Badge>
                    {advertisement.mp4Url ? (
                        <span className="absolute bottom-3 end-3 inline-flex items-center gap-1 rounded-md bg-background/85 px-2 py-1 text-xs font-medium">
                            <Download className="size-3" aria-hidden="true" />
                            {t('card.ready')}
                        </span>
                    ) : null}
                </div>

                <CardHeader className="gap-1">
                    <CardTitle className="truncate text-lg">
                        <bdi>{advertisement.projectTitle}</bdi>
                    </CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-2 text-xs">
                        <span>{languageLabel(t, advertisement.contentLanguage)}</span>
                        <span aria-hidden="true">·</span>
                        {advertisement.durationSec !== null ? (
                            <span>{t('card.duration', { seconds: formatters.number(advertisement.durationSec) })}</span>
                        ) : null}
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                    <time
                        dateTime={advertisement.updatedAt}
                        title={relative.absolute || undefined}
                        className="text-xs text-muted-foreground"
                    >
                        {t('card.updated', { time: relative.relative })}
                    </time>
                </CardContent>
            </Link>

            {canArchive && onArchive ? (
                <CardFooter className="justify-end pt-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-muted-foreground hover:text-destructive"
                        onClick={() => setConfirmOpen(true)}
                    >
                        <Trash2 className="size-4" aria-hidden="true" />
                        {t('card.archive')}
                    </Button>
                </CardFooter>
            ) : null}

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('card.archive')}</DialogTitle>
                        <DialogDescription>{t('card.archiveConfirm')}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" className="h-11" onClick={() => setConfirmOpen(false)}>
                            {t('card.cancel')}
                        </Button>
                        <Button
                            variant="destructive"
                            className="h-11"
                            disabled={archivePending}
                            onClick={() => {
                                setConfirmOpen(false);
                                onArchive?.(advertisement.id);
                            }}
                        >
                            <Trash2 className="me-2 size-4" aria-hidden="true" />
                            {t('card.archive')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
