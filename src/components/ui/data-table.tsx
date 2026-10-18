'use client';

import * as React from 'react';
import {
    type ColumnDef,
    type SortingState,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';

import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

/**
 * Shadcn's data-table pattern: `@tanstack/react-table` driving the `table`
 * primitive. Sorting is on by default; pagination renders only when there is
 * more than one page, so a five-member team does not grow a pager it can never
 * use.
 */
interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    pageSize?: number;
    emptyMessage?: string;
    className?: string;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    pageSize = 10,
    emptyMessage = 'No results.',
    className,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([]);

    // React Compiler cannot memoize TanStack Table's mutable instance (it warns
    // `react-hooks/incompatible-library`). This is the library's documented React
    // integration, and the React docs' guidance for such libraries is exactly to
    // opt the call site out rather than fight the compiler.
    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize } },
    });

    const pageCount = table.getPageCount();

    return (
        <div className="space-y-4">
            <div className={cn('rounded-md border border-border/50', className)}>
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    const sorted = header.column.getIsSorted();
                                    const canSort = header.column.getCanSort();
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder ? null : canSort ? (
                                                <button
                                                    type="button"
                                                    onClick={header.column.getToggleSortingHandler()}
                                                    className="inline-flex items-center gap-1.5 text-xs font-semibold hover:text-foreground"
                                                >
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                    <ArrowUpDown
                                                        className={cn(
                                                            'h-3 w-3',
                                                            sorted ? 'text-foreground' : 'text-muted-foreground'
                                                        )}
                                                    />
                                                </button>
                                            ) : (
                                                flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )
                                            )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {pageCount > 1 && (
                <Pagination className="justify-end">
                    <PaginationContent>
                        <span className="mr-2 text-xs text-muted-foreground">
                            Page {table.getState().pagination.pageIndex + 1} of {pageCount}
                        </span>
                        <PaginationItem>
                            <PaginationPrevious
                                href="#"
                                aria-disabled={!table.getCanPreviousPage()}
                                className={cn(!table.getCanPreviousPage() && 'pointer-events-none opacity-50')}
                                onClick={(e) => {
                                    e.preventDefault();
                                    table.previousPage();
                                }}
                            />
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationNext
                                href="#"
                                aria-disabled={!table.getCanNextPage()}
                                className={cn(!table.getCanNextPage() && 'pointer-events-none opacity-50')}
                                onClick={(e) => {
                                    e.preventDefault();
                                    table.nextPage();
                                }}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
}
