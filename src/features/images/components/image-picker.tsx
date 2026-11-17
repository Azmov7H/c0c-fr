'use client';

import { useCallback, useMemo, useState, type FormEvent } from 'react';
import { Check, ImageOff, Loader2, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

import { useImageSearch, useSelectImage } from '../hooks/use-images';
import type { UnsplashAssetMetadata, UnsplashOrientation, UnsplashPhoto } from '../types';
import { UnsplashAttribution } from './unsplash-attribution';
import { UnsplashImage } from './unsplash-image';

interface ImagePickerProps {
    /** The photo currently attached, so the picker can show what is in use. */
    selected?: UnsplashAssetMetadata | null;
    /** Called with the authoritative photo the user picked. */
    onSelect: (photo: UnsplashPhoto) => void;
    /** Called when the user clears the current photo. */
    onClear?: () => void;
    /** The trigger label. */
    triggerLabel?: string;
    /** A default orientation filter for this slot (a thumbnail is landscape). */
    orientation?: UnsplashOrientation;
    className?: string;
}

const ORIENTATION_FILTERS: Array<UnsplashOrientation | 'all'> = [
    'all',
    'landscape',
    'portrait',
    'squarish',
];

/**
 * The stock-photo picker.
 *
 * The user searches Unsplash, previews the results, and picks ONE. Nothing
 * is chosen for them: an image that appears in a result grid has not been
 * used, and the download event is only recorded when a photo is actually
 * picked — which is exactly what the Unsplash guidelines ask for.
 */
export function ImagePicker({
    selected,
    onSelect,
    onClear,
    triggerLabel,
    orientation,
    className,
}: ImagePickerProps) {
    const t = useTranslations('media');

    const [open, setOpen] = useState(false);
    const [term, setTerm] = useState('');
    const [submitted, setSubmitted] = useState('');
    const [filter, setFilter] = useState<UnsplashOrientation | 'all'>(orientation ?? 'all');

    const search = useImageSearch({
        query: submitted,
        orientation: filter === 'all' ? undefined : filter,
    });
    const selectImage = useSelectImage();

    const onSubmit = useCallback((event: FormEvent) => {
        event.preventDefault();
        const trimmed = term.trim();
        if (!trimmed) return;
        setSubmitted(trimmed);
    }, [term]);

    const onPick = useCallback(
        (photo: UnsplashPhoto) => {
            selectImage.mutate(photo.photoId, {
                onSuccess: (authoritative) => {
                    onSelect(authoritative);
                    setOpen(false);
                },
            });
        },
        [onSelect, selectImage]
    );

    const results = useMemo(
        () => (search.data?.pages ?? []).flatMap((page) => page.data),
        [search.data]
    );
    const isSearching = search.isFetching;

    // Stated statically so the i18n gate can check every key.
    const orientationLabels: Record<UnsplashOrientation, string> = {
        landscape: t('picker.orientation.landscape'),
        portrait: t('picker.orientation.portrait'),
        squarish: t('picker.orientation.squarish'),
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className={className}>
                    <Search className="me-1 size-4" aria-hidden="true" />
                    {triggerLabel ?? t('picker.trigger')}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{t('picker.title')}</DialogTitle>
                    <DialogDescription>{t('picker.description')}</DialogDescription>
                </DialogHeader>

                {selected ? (
                    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-3">
                        <div className="size-14 shrink-0 overflow-hidden rounded-lg">
                            <UnsplashImage
                                src={selected.thumbnailUrl || selected.imageUrl}
                                alt={selected.altDescription || t('picker.selectedAlt')}
                                width={56}
                                height={56}
                                className="size-full"
                            />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{t('picker.selected')}</p>
                            <UnsplashAttribution photo={selected} />
                        </div>
                        {onClear && (
                            <Button variant="ghost" size="sm" onClick={onClear}>
                                <X className="me-1 size-4" aria-hidden="true" />
                                {t('picker.clear')}
                            </Button>
                        )}
                    </div>
                ) : null}

                <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
                    <div className="flex-1">
                        <Label htmlFor="unsplash-search" className="sr-only">
                            {t('picker.searchLabel')}
                        </Label>
                        <Input
                            id="unsplash-search"
                            value={term}
                            onChange={(event) => setTerm(event.target.value)}
                            placeholder={t('picker.searchPlaceholder')}
                            className="h-11 text-base"
                        />
                    </div>
                    <Select
                        value={filter}
                        onValueChange={(value) => setFilter(value as UnsplashOrientation | 'all')}
                    >
                        <SelectTrigger className="h-11 sm:w-44" aria-label={t('picker.orientationLabel')}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {ORIENTATION_FILTERS.map((value) => (
                                <SelectItem key={value} value={value}>
                                    {value === 'all'
                                        ? t('picker.orientationAll')
                                        : orientationLabels[value]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button type="submit" className="h-11" disabled={!term.trim() || isSearching}>
                        {isSearching ? (
                            <Loader2 className="me-2 size-4 animate-spin" aria-hidden="true" />
                        ) : (
                            <Search className="me-2 size-4" aria-hidden="true" />
                        )}
                        {t('picker.search')}
                    </Button>
                </form>

                {search.isError ? (
                    <EmptyState
                        className="min-h-0 border-0 bg-transparent p-0"
                        icon={ImageOff}
                        title={t('picker.errorTitle')}
                        description={t('picker.errorDescription')}
                    />
                ) : !submitted ? (
                    <EmptyState
                        className="min-h-0 border-0 bg-transparent p-0"
                        icon={Search}
                        title={t('picker.idleTitle')}
                        description={t('picker.idleDescription')}
                    />
                ) : isSearching && results.length === 0 ? (
                    <div
                        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
                        role="status"
                        aria-label={t('picker.loading')}
                    >
                        {Array.from({ length: 8 }).map((_, index) => (
                            <Skeleton key={index} className="aspect-square rounded-xl" />
                        ))}
                    </div>
                ) : results.length === 0 ? (
                    <EmptyState
                        className="min-h-0 border-0 bg-transparent p-0"
                        icon={Search}
                        title={t('picker.emptyTitle')}
                        description={t('picker.emptyDescription')}
                    />
                ) : (
                    <>
                        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {results.map((photo) => {
                                const isCurrent = selected?.photoId === photo.photoId;
                                return (
                                    <li key={photo.photoId}>
                                        <button
                                            type="button"
                                            onClick={() => onPick(photo)}
                                            disabled={selectImage.isPending}
                                            aria-pressed={isCurrent}
                                            className="group block w-full overflow-hidden rounded-xl border border-border/60 text-start transition-colors hover:border-primary/60 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 aria-pressed:border-primary aria-pressed:ring-2 aria-pressed:ring-primary/40"
                                        >
                                            <span
                                                className="relative block aspect-square w-full overflow-hidden"
                                                style={photo.color ? { backgroundColor: photo.color } : undefined}
                                            >
                                                <UnsplashImage
                                                    src={photo.thumbnailUrl || photo.imageUrl}
                                                    alt={photo.altDescription || photo.photographerName}
                                                    width={photo.width}
                                                    height={photo.height}
                                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                                    className="size-full"
                                                />
                                                {isCurrent && (
                                                    <span className="absolute end-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                                        <Check className="size-4" aria-hidden="true" />
                                                    </span>
                                                )}
                                            </span>
                                            <span className="block space-y-0.5 p-2">
                                                <span className="block truncate text-xs font-medium">
                                                    {photo.photographerName || photo.photographerUsername}
                                                </span>
                                                <span className="block truncate text-[11px] text-muted-foreground">
                                                    {photo.altDescription}
                                                </span>
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                        {search.hasNextPage && (
                            <div className="flex justify-center pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => search.fetchNextPage()}
                                    disabled={isSearching}
                                >
                                    {isSearching ? (
                                        <Loader2 className="me-2 size-4 animate-spin" aria-hidden="true" />
                                    ) : null}
                                    {t('picker.loadMore')}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
