'use client';

import { useEffect, useRef, useState } from 'react';
import { LayoutGrid, List, Search, SlidersHorizontal, X } from 'lucide-react';

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
import {
    PLATFORM_LABEL,
    PROJECT_PLATFORMS,
    STATUS_LABEL,
} from '../lib/project-constants';

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
}: {
    filters: ProjectFilters;
    onToggleStatus: (status: ProjectStatus) => void;
    onTogglePlatform: (platform: Platform) => void;
    onToggleArchived: () => void;
}) {
    return (
        <div className="space-y-6">
            <fieldset>
                <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Status
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
                            {STATUS_LABEL[status]}
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
                        {STATUS_LABEL.archived}
                    </Button>
                </div>
            </fieldset>

            <fieldset>
                <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Platform
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
                            {PLATFORM_LABEL[platform]}
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
                        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                    />
                    <Input
                        id="projects-search"
                        type="search"
                        aria-label="Search projects"
                        placeholder="Search projects..."
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        className="h-11 pl-9 pr-9"
                    />
                    {search ? (
                        <button
                            type="button"
                            aria-label="Clear search"
                            className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                                aria-label="Filter by status and platform"
                            >
                                <SlidersHorizontal className="size-4" aria-hidden="true" />
                                Filters
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                            <DropdownMenuLabel>Status</DropdownMenuLabel>
                            {LIST_STATUSES.map((status) => (
                                <DropdownMenuCheckboxItem
                                    key={status}
                                    checked={filters.statuses.includes(status)}
                                    onCheckedChange={() => toggleStatus(status)}
                                >
                                    {STATUS_LABEL[status]}
                                </DropdownMenuCheckboxItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Platform</DropdownMenuLabel>
                            {PROJECT_PLATFORMS.map((platform) => (
                                <DropdownMenuCheckboxItem
                                    key={platform}
                                    checked={filters.platforms.includes(platform)}
                                    onCheckedChange={() => togglePlatform(platform)}
                                >
                                    {PLATFORM_LABEL[platform]}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                className="h-11 gap-2 md:hidden"
                                aria-label="Filter projects"
                            >
                                <SlidersHorizontal className="size-4" aria-hidden="true" />
                                Filters
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-full sm:max-w-sm">
                            <SheetHeader>
                                <SheetTitle>Filters</SheetTitle>
                                <SheetDescription>Status, platform and sort order.</SheetDescription>
                            </SheetHeader>
                            <div className="space-y-6 px-4">
                                <FilterChecklist
                                    filters={filters}
                                    onToggleStatus={toggleStatus}
                                    onTogglePlatform={togglePlatform}
                                    onToggleArchived={toggleArchived}
                                />
                                <div className="space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Sort
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
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <SheetFooter>
                                <Button variant="outline" className="h-11" onClick={onClear}>
                                    Clear filters
                                </Button>
                                <SheetClose asChild>
                                    <Button className="h-11">
                                        Show {resultCount ?? 0} result{resultCount === 1 ? '' : 's'}
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
                        <SelectTrigger className="hidden h-11 w-[190px] md:flex" aria-label="Sort projects">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {PROJECT_SORTS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
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
                            aria-label="Grid view"
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
                            aria-label="Table view"
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
                            Clear
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
                    {statusMatches(filters, 'archived') ? 'Viewing archive' : 'View archive'}
                </Button>
                <p className="text-xs text-muted-foreground" aria-live="polite">
                    {typeof resultCount === 'number' ? (
                        <>
                            <span className="font-semibold text-foreground">{resultCount}</span>{' '}
                            {activeFilters ? 'matching' : 'total'}{' '}
                            {resultCount === 1 ? 'project' : 'projects'}
                        </>
                    ) : null}
                </p>
            </div>
        </div>
    );
}
