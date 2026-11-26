'use client';

import { useEffect, useRef, useState } from 'react';
import { LayoutGrid, List, Search, SlidersHorizontal, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { Platform, ProjectStatus } from '@/types';

import {
    hasProjectFilters,
    PROJECT_SORTS,
    toggleValue,
    type ProjectFilters,
    type ProjectView,
} from '../lib/project-filters';
import { platformLabel, projectNoun, sortLabel, statusLabel } from '../lib/projects-labels';
import type { ProjectsTranslator } from '../lib/projects-labels';
import { PROJECT_PLATFORMS } from '../lib/project-constants';

const LIST_STATUSES: ProjectStatus[] = ['draft', 'processing', 'completed'];

interface ProjectsToolbarProps {
    filters: ProjectFilters;
    onChange: (next: ProjectFilters) => void;
    onClear: () => void;
    view: ProjectView;
    onViewChange: (view: ProjectView) => void;
    resultCount?: number;
}

function statusMatches(filters: ProjectFilters, status: ProjectStatus): boolean {
    if (status === 'archived') {
        return filters.statuses.length === 1 && filters.statuses[0] === 'archived';
    }
    return filters.statuses.includes(status);
}

function FilterChecklist({
    filters,
    onToggleStatus,
    onTogglePlatform,
    onToggleArchived,
    t,
}: {
    filters: ProjectFilters;
    onToggleStatus: (status: ProjectStatus) => void;
    onTogglePlatform: (platform: Platform) => void;
    onToggleArchived: () => void;
    t: ProjectsTranslator;
}) {
    return (
        <div className="space-y-6">
            <fieldset>
                <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t('toolbar.statusLegend')}
                </legend>
                <div className="flex flex-wrap gap-2">
                    {LIST_STATUSES.map((status) => (
                        <Button
                            key={status}
                            type="button"
                            size="sm"
                            variant={statusMatches(filters, status) ? 'default' : 'outline'}
                            aria-pressed={statusMatches(filters, status)}
                            className="h-11"
                            onClick={() => onToggleStatus(status)}
                        >
                            {statusLabel(t, status)}
                        </Button>
                    ))}
                    <Button
                        type="button"
                        size="sm"
                        variant={statusMatches(filters, 'archived') ? 'default' : 'outline'}
                        aria-pressed={statusMatches(filters, 'archived')}
                        className="h-11"
                        onClick={onToggleArchived}
                    >
                        {statusLabel(t, 'archived')}
                    </Button>
                </div>
            </fieldset>

            <fieldset>
                <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t('toolbar.platformLegend')}
                </legend>
                <div className="flex flex-wrap gap-2">
                    {PROJECT_PLATFORMS.map((platform) => (
                        <Button
                            key={platform}
                            type="button"
                            size="sm"
                            variant={filters.platforms.includes(platform) ? 'default' : 'outline'}
                            aria-pressed={filters.platforms.includes(platform)}
                            className="h-11"
                            onClick={() => onTogglePlatform(platform)}
                        >
                            {platformLabel(t, platform)}
                        </Button>
                    ))}
                </div>
            </fieldset>
        </div>
    );
}

export function ProjectsToolbar({
    filters,
    onChange,
    onClear,
    view,
    onViewChange,
    resultCount,
}: ProjectsToolbarProps) {
    const t = useTranslations('projects');
    const [search, setSearch] = useState(filters.q);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Typing updates the input immediately and the URL after 300 ms. The input
    // is not driven by `filters.q`: rewriting it from an effect would fight the
    // user mid-keystroke. Browser back/forward resynchronises it below.
    const onSearchChange = (value: string) => {
        setSearch(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            const q = value.trim();
            if (q !== filters.q) onChange({ ...filters, q, page: 1 });
        }, 300);
    };

    useEffect(() => {
        const syncFromHistory = () => setSearch(filters.q);
        window.addEventListener('popstate', syncFromHistory);
        return () => {
            window.removeEventListener('popstate', syncFromHistory);
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [filters.q]);

    const toggleStatus = (status: ProjectStatus) => {
        const withoutArchived = filters.statuses.filter((value) => value !== 'archived');
        const statuses =
            status === 'archived'
                ? ['archived']
                : toggleValue(withoutArchived, status);
        onChange({ ...filters, statuses: statuses as ProjectStatus[], page: 1 });
    };

    const togglePlatform = (platform: Platform) => {
        onChange({
            ...filters,
            platforms: toggleValue(filters.platforms, platform),
            page: 1,
        });
    };

    const toggleArchived = () => {
        onChange({
            ...filters,
            statuses: statusMatches(filters, 'archived') ? [] : ['archived'],
            page: 1,
        });
    };

    const activeFilters = hasProjectFilters(filters);

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1 sm:max-w-sm">
                    <Search
                        className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                    />
                    <Input
                        id="projects-search"
                        type="search"
                        aria-label={t('toolbar.searchAria')}
                        placeholder={t('toolbar.searchPlaceholder')}
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        className="h-11 ps-9 pe-9"
                    />
                    {search ? (
                        <button
                            type="button"
                            aria-label={t('toolbar.clearSearch')}
                            className="absolute end-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={() => {
                                if (debounceRef.current) clearTimeout(debounceRef.current);
                                setSearch('');
                                onChange({ ...filters, q: '', page: 1 });
                            }}
                        >
                            <X className="size-4" aria-hidden="true" />
                        </button>
                    ) : null}
                </div>

                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="hidden h-11 gap-2 md:inline-flex"
                                aria-label={`${t('toolbar.filterText')} — ${t('toolbar.filterAria')}`}
                            >
                                <SlidersHorizontal className="size-4" aria-hidden="true" />
                                {t('toolbar.filterText')}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                            <DropdownMenuLabel>{t('toolbar.statusLegend')}</DropdownMenuLabel>
                            {LIST_STATUSES.map((status) => (
                                <DropdownMenuCheckboxItem
                                    key={status}
                                    checked={filters.statuses.includes(status)}
                                    onCheckedChange={() => toggleStatus(status)}
                                >
                                    {statusLabel(t, status)}
                                </DropdownMenuCheckboxItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>{t('toolbar.platformLegend')}</DropdownMenuLabel>
                            {PROJECT_PLATFORMS.map((platform) => (
                                <DropdownMenuCheckboxItem
                                    key={platform}
                                    checked={filters.platforms.includes(platform)}
                                    onCheckedChange={() => togglePlatform(platform)}
                                >
                                    {platformLabel(t, platform)}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                className="h-11 gap-2 md:hidden"
                                aria-label={`${t('toolbar.filterText')} — ${t('toolbar.filterAriaMobile')}`}
                            >
                                <SlidersHorizontal className="size-4" aria-hidden="true" />
                                {t('toolbar.filterText')}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-full sm:max-w-sm">
                            <SheetHeader>
                                <SheetTitle>{t('toolbar.filtersTitle')}</SheetTitle>
                                <SheetDescription>
                                    {t('toolbar.filtersDescription')}
                                </SheetDescription>
                            </SheetHeader>
                            <div className="space-y-6 px-4">
                                <FilterChecklist
                                    filters={filters}
                                    onToggleStatus={toggleStatus}
                                    onTogglePlatform={togglePlatform}
                                    onToggleArchived={toggleArchived}
                                    t={t}
                                />
                                <div className="space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        {t('toolbar.sortLabel')}
                                    </p>
                                    <Select
                                        value={filters.sort}
                                        onValueChange={(sort) =>
                                            onChange({
                                                ...filters,
                                                sort: sort as ProjectFilters['sort'],
                                                page: 1,
                                            })
                                        }
                                    >
                                        <SelectTrigger className="h-11 w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PROJECT_SORTS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {sortLabel(t, option.value)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <SheetFooter>
                                <Button variant="outline" className="h-11" onClick={onClear}>
                                    {t('toolbar.footerClear')}
                                </Button>
                                <SheetClose asChild>
                                    <Button className="h-11">
                                        {t('toolbar.footerShow', { count: resultCount ?? 0 })}
                                    </Button>
                                </SheetClose>
                            </SheetFooter>
                        </SheetContent>
                    </Sheet>

                    <Select
                        value={filters.sort}
                        onValueChange={(sort) =>
                            onChange({
                                ...filters,
                                sort: sort as ProjectFilters['sort'],
                                page: 1,
                            })
                        }
                    >
                        <SelectTrigger className="hidden h-11 w-[190px] md:flex" aria-label={t('toolbar.sortAria')}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {PROJECT_SORTS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {sortLabel(t, option.value)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="hidden items-center rounded-lg border border-border/60 p-0.5 md:flex">
                        <Button
                            type="button"
                            size="icon"
                            variant={view === 'grid' ? 'secondary' : 'ghost'}
                            className="size-10"
                            aria-label={t('toolbar.viewGridAria')}
                            aria-pressed={view === 'grid'}
                            onClick={() => onViewChange('grid')}
                        >
                            <LayoutGrid className="size-4" aria-hidden="true" />
                        </Button>
                        <Button
                            type="button"
                            size="icon"
                            variant={view === 'table' ? 'secondary' : 'ghost'}
                            className="size-10"
                            aria-label={t('toolbar.viewTableAria')}
                            aria-pressed={view === 'table'}
                            onClick={() => onViewChange('table')}
                        >
                            <List className="size-4" aria-hidden="true" />
                        </Button>
                    </div>

                    {activeFilters ? (
                        <Button
                            type="button"
                            variant="ghost"
                            className="h-11 px-3 text-muted-foreground hover:text-foreground"
                            onClick={onClear}
                        >
                            {t('toolbar.clear')}
                        </Button>
                    ) : null}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Button
                    type="button"
                    size="sm"
                    variant={statusMatches(filters, 'archived') ? 'default' : 'outline'}
                    aria-pressed={statusMatches(filters, 'archived')}
                    className={cn('h-9', statusMatches(filters, 'archived') && 'shadow-sm')}
                    onClick={toggleArchived}
                >
                    {statusMatches(filters, 'archived')
                        ? t('toolbar.archiveOn')
                        : t('toolbar.archiveOff')}
                </Button>
                <p className="text-xs text-muted-foreground" aria-live="polite">
                    {typeof resultCount === 'number' ? (
                        <>
                            <span className="font-semibold text-foreground">{resultCount}</span>{' '}
                            {activeFilters ? t('toolbar.resultsMatch') : t('toolbar.resultsTotal')}{' '}
                            {projectNoun(t, resultCount)}
                        </>
                    ) : null}
                </p>
            </div>
        </div>
    );
}
