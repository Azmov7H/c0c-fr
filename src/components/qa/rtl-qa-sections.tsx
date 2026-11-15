'use client';

/**
 * AR-021 — the sections the QA gallery renders.
 *
 * One component per family of primitives, driven by the sample text of the
 * pane it is rendered in (English in the LTR pane, Arabic in the RTL pane).
 *
 * Two rules for everything in here:
 *
 *   1. LOGICAL utilities only (`me-`, `ps-`, `start-`, `text-end`). The RTL
 *      gate (AR-020) enforces it for the whole of `src/**`, and this file is
 *      no exception — a gallery that used physical utilities would hide the
 *      very defects it exists to show.
 *   2. No catalog strings. The gallery is a review artifact, not a product
 *      surface, so it introduces no product copy and belongs to no namespace
 *      (see `rtl-qa-content.ts` for why).
 */

import * as React from 'react';
import {
    Check,
    FolderKanban,
    Play,
    Plus,
    Search,
    Upload,
    X,
} from 'lucide-react';

import { DirIcon } from '@/components/icons/dir-icon';
import { StatCard } from '@/components/shared/stat-card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import type { QaSampleText } from './rtl-qa-content';

/** The frame every section sits in. */
function QaSection({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-3 rounded-xl border border-border/60 p-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {title}
            </h2>
            <div className="space-y-3">{children}</div>
        </section>
    );
}

function ButtonsSection({ text }: { text: QaSampleText }) {
    return (
        <QaSection title="Buttons">
            <div className="flex flex-wrap items-center gap-2">
                <Button>{text.buttons.primary}</Button>
                <Button variant="secondary">{text.buttons.secondary}</Button>
                <Button variant="outline">{text.buttons.outline}</Button>
                <Button variant="ghost">{text.buttons.ghost}</Button>
                <Button variant="destructive">{text.buttons.destructive}</Button>
                <Button>
                    <Plus className="me-2 size-4" aria-hidden="true" />
                    {text.buttons.withIcon}
                </Button>
            </div>
        </QaSection>
    );
}

function FormSection({ text }: { text: QaSampleText }) {
    return (
        <QaSection title="Form">
            <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <Label htmlFor="qa-email">{text.form.label}</Label>
                    <Input id="qa-email" type="email" placeholder={text.form.placeholder} />
                    <p className="text-xs text-muted-foreground">{text.form.helper}</p>
                    <label className="flex items-center gap-2 pt-2 text-sm">
                        <input type="checkbox" defaultChecked />
                        {text.form.checkbox}
                    </label>
                </div>

                <fieldset className="space-y-2">
                    <legend className="mb-1.5 text-sm font-medium">{text.form.radioLegend}</legend>
                    <RadioGroup defaultValue={text.form.radioOptions[0]}>
                        {text.form.radioOptions.map((option, index) => (
                            <div key={option} className="flex items-center gap-2">
                                <RadioGroupItem value={option} id={`qa-radio-${index}`} />
                                <Label htmlFor={`qa-radio-${index}`}>{option}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                </fieldset>

                <div className="space-y-1.5">
                    <Label htmlFor="qa-select">{text.form.selectLabel}</Label>
                    <Select defaultValue={text.form.selectOptions[0]}>
                        <SelectTrigger id="qa-select">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {text.form.selectOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="qa-textarea">{text.form.textareaLabel}</Label>
                    <Textarea id="qa-textarea" placeholder={text.form.textareaPlaceholder} rows={3} />
                </div>
            </div>
        </QaSection>
    );
}

function CardSection({ text }: { text: QaSampleText }) {
    return (
        <QaSection title="Card">
            <Card>
                <CardHeader>
                    <CardTitle>{text.card.title}</CardTitle>
                    <CardDescription>{text.card.description}</CardDescription>
                    <CardAction>
                        <Button variant="outline" size="sm">
                            {text.card.action}
                        </Button>
                    </CardAction>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">{text.card.footer}</p>
                </CardContent>
                <CardFooter>
                    <Button size="sm">{text.buttons.primary}</Button>
                </CardFooter>
            </Card>
        </QaSection>
    );
}

function StatsSection({ text }: { text: QaSampleText }) {
    return (
        <QaSection title="Stat cards">
            <div className="grid gap-3 sm:grid-cols-3">
                {text.stats.map((stat) => (
                    <StatCard
                        key={stat.label}
                        label={stat.label}
                        value={stat.value}
                        trend={stat.change}
                        icon={FolderKanban}
                    />
                ))}
            </div>
        </QaSection>
    );
}

function TableSection({ text }: { text: QaSampleText }) {
    return (
        <QaSection title="Table">
            <Table>
                <TableCaption>{text.table.caption}</TableCaption>
                <TableHeader>
                    <TableRow>
                        {text.table.headers.map((header, index) => (
                            <TableHead
                                key={header}
                                className={index === text.table.headers.length - 1 ? 'text-end' : undefined}
                            >
                                {header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {text.table.rows.map((row) => (
                        <TableRow key={row[0]}>
                            {row.map((cell, index) => (
                                <TableCell
                                    key={cell}
                                    className={
                                        index === text.table.headers.length - 1
                                            ? 'text-end tabular-nums'
                                            : undefined
                                    }
                                >
                                    {cell}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </QaSection>
    );
}

function PaginationSection({ text }: { text: QaSampleText }) {
    return (
        <QaSection title="Pagination">
            <Pagination aria-label={text.pagination.navLabel}>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationLink href="#" size="icon" aria-label={text.pagination.previous}>
                            <DirIcon name="ChevronLeft" />
                        </PaginationLink>
                    </PaginationItem>
                    {['1', '2', '3'].map((page) => (
                        <PaginationItem key={page}>
                            <PaginationLink href="#" isActive={page === '2'}>
                                {page}
                            </PaginationLink>
                        </PaginationItem>
                    ))}
                    <PaginationItem>
                        <PaginationLink href="#" size="icon" aria-label={text.pagination.next}>
                            <DirIcon name="ChevronRight" />
                        </PaginationLink>
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
            <p className="text-xs text-muted-foreground">{text.pagination.page}</p>
        </QaSection>
    );
}

function TabsSection({ text }: { text: QaSampleText }) {
    return (
        <QaSection title="Tabs">
            {/* AR-021: the tab VALUE is an identifier, never the translated
                label. Radix builds the trigger's id from the value, and an id
                with a space in it is invalid HTML — the `aria-controls` that
                points at it stops resolving, and the tabs lose their
                semantics. The label is the TEXT; the value is a key. */}
            <Tabs defaultValue="tab-0">
                <TabsList>
                    {text.tabs.labels.map((label, index) => (
                        <TabsTrigger key={label} value={`tab-${index}`}>
                            {label}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {text.tabs.labels.map((label, index) => (
                    <TabsContent key={label} value={`tab-${index}`}>
                        <p className="text-sm text-muted-foreground">{label}</p>
                    </TabsContent>
                ))}
            </Tabs>
        </QaSection>
    );
}

function AccordionSection({ text }: { text: QaSampleText }) {
    return (
        <QaSection title="Accordion">
            <Accordion type="single" collapsible defaultValue="item-0">
                {text.accordion.items.map((item, index) => (
                    <AccordionItem key={item.question} value={`item-${index}`}>
                        <AccordionTrigger>{item.question}</AccordionTrigger>
                        <AccordionContent>{item.answer}</AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </QaSection>
    );
}

function BreadcrumbSection({ text }: { text: QaSampleText }) {
    return (
        <QaSection title="Breadcrumb">
            <Breadcrumb aria-label={text.breadcrumb.navLabel}>
                <BreadcrumbList>
                    {text.breadcrumb.items.map((item, index) => (
                        <BreadcrumbItem key={item}>
                            {index < text.breadcrumb.items.length - 1 ? (
                                <>
                                    <BreadcrumbLink href="#">{item}</BreadcrumbLink>
                                    <BreadcrumbSeparator />
                                </>
                            ) : (
                                <BreadcrumbPage>{item}</BreadcrumbPage>
                            )}
                        </BreadcrumbItem>
                    ))}
                </BreadcrumbList>
            </Breadcrumb>
        </QaSection>
    );
}

function AlertsSection({ text }: { text: QaSampleText }) {
    return (
        <QaSection title="Alerts and badges">
            <Alert>
                <AlertTitle>{text.alert.title}</AlertTitle>
                <AlertDescription>{text.alert.description}</AlertDescription>
            </Alert>
            <Alert variant="destructive">
                <AlertTitle>{text.buttons.destructive}</AlertTitle>
                <AlertDescription>{text.dialog.description}</AlertDescription>
            </Alert>
            <div className="flex flex-wrap items-center gap-2">
                {text.badges.map((badge, index) => (
                    <Badge
                        key={badge}
                        variant={
                            index === 0
                                ? 'success'
                                : index === 1
                                  ? 'warning'
                                  : index === 2
                                    ? 'destructive'
                                    : 'outline'
                        }
                    >
                        {badge}
                    </Badge>
                ))}
            </div>
        </QaSection>
    );
}

function EmptyStateSection({ text }: { text: QaSampleText }) {
    return (
        <QaSection title="Empty state">
            <EmptyState
                className="min-h-[220px]"
                title={text.empty.title}
                description={text.empty.description}
                action={{ label: text.empty.action, onClick: () => undefined }}
            />
        </QaSection>
    );
}

function OverlaysSection({
    text,
    direction,
}: {
    text: QaSampleText;
    direction: 'ltr' | 'rtl';
}) {
    // The sheet's side is a PHYSICAL edge, and it is the CALLER's choice
    // (the shell decides which edge a drawer opens from). The gallery shows
    // both, resolved from the LOGICAL intent: the start edge and the end
    // edge — which are different physical edges in the two directions.
    const startSide = direction === 'rtl' ? 'right' : 'left';
    const endSide = direction === 'rtl' ? 'left' : 'right';

    return (
        <QaSection title="Overlays (tooltip, menu, dialog, sheet)">
            <div className="flex flex-wrap items-center gap-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline">{text.tooltip.trigger}</Button>
                    </TooltipTrigger>
                    <TooltipContent>{text.tooltip.content}</TooltipContent>
                </Tooltip>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">{text.dropdown.trigger}</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuLabel>{text.dropdown.trigger}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {text.dropdown.items.map((item, index) => (
                            <DropdownMenuItem key={item}>
                                {item}
                                {index === 0 ? (
                                    <span className="ms-auto text-xs text-muted-foreground">⌘S</span>
                                ) : null}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="destructive">{text.dialog.trigger}</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{text.dialog.title}</DialogTitle>
                            <DialogDescription>{text.dialog.description}</DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">{text.dialog.cancel}</Button>
                            </DialogClose>
                            <DialogClose asChild>
                                <Button variant="destructive">{text.dialog.confirm}</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline">{text.sheet.startTrigger}</Button>
                    </SheetTrigger>
                    <SheetContent side={startSide}>
                        <SheetHeader>
                            <SheetTitle>{text.sheet.title}</SheetTitle>
                            <SheetDescription>{text.sheet.description}</SheetDescription>
                        </SheetHeader>
                    </SheetContent>
                </Sheet>

                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline">{text.sheet.endTrigger}</Button>
                    </SheetTrigger>
                    <SheetContent side={endSide}>
                        <SheetHeader>
                            <SheetTitle>{text.sheet.title}</SheetTitle>
                            <SheetDescription>{text.sheet.description}</SheetDescription>
                        </SheetHeader>
                    </SheetContent>
                </Sheet>
            </div>
        </QaSection>
    );
}

function FeedbackSection({ text }: { text: QaSampleText }) {
    return (
        <QaSection title="Progress, avatar, skeleton, separator, scroll area">
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span>{text.progress.label}</span>
                    <span className="tabular-nums">{text.progress.value}%</span>
                </div>
                <Progress value={text.progress.value} aria-label={text.progress.label} />
            </div>

            <div className="flex items-center gap-3">
                <Avatar>
                    <AvatarFallback>{text.avatar.initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{text.avatar.name}</span>
            </div>

            <div className="space-y-2">
                <span className="text-sm text-muted-foreground">{text.skeleton.label}</span>
                <Skeleton className="h-8 w-full" />
            </div>

            <div className="space-y-2">
                <span className="text-sm text-muted-foreground">{text.separator.label}</span>
                <Separator />
            </div>

            <ScrollArea className="h-24 rounded-md border">
                <div className="p-3 text-sm">{text.alert.description}</div>
            </ScrollArea>
        </QaSection>
    );
}

/**
 * The icon direction table (AR-019), rendered live.
 *
 * The mirrored row goes through `DirIcon` — the ONE wrapper that may flip a
 * glyph — and the never-mirrored row renders the icons directly, which is
 * what the app does: a semantic glyph has no `rtl:` class at all, so it
 * cannot flip.
 */
function IconsSection({ text }: { text: QaSampleText }) {
    const neverMirrored = {
        Play,
        Check,
        X,
        Search,
        Upload,
    } as const;

    return (
        <QaSection title={text.icons.title}>
            <p className="text-xs text-muted-foreground">{text.icons.note}</p>
            <div className="space-y-2">
                <p className="text-xs font-semibold">{text.icons.mirroredLabel}</p>
                <div className="flex flex-wrap items-center gap-3">
                    {text.icons.mirroredNames.map((name) => (
                        <span key={name} className="flex items-center gap-1.5 text-xs">
                            <DirIcon name={name} className="size-5" />
                            <code className="text-muted-foreground">{name}</code>
                        </span>
                    ))}
                </div>
            </div>
            <div className="space-y-2">
                <p className="text-xs font-semibold">{text.icons.neverMirroredLabel}</p>
                <div className="flex flex-wrap items-center gap-3">
                    {Object.entries(neverMirrored).map(([name, Icon]) => (
                        <span key={name} className="flex items-center gap-1.5 text-xs">
                            <Icon className="size-5" aria-hidden="true" />
                            <code className="text-muted-foreground">{name}</code>
                        </span>
                    ))}
                </div>
            </div>
        </QaSection>
    );
}

/** Every section, in the order a reviewer wants to see them. */
export function RtlQaSections({
    text,
    direction,
}: {
    text: QaSampleText;
    direction: 'ltr' | 'rtl';
}) {
    return (
        <TooltipProvider>
            <ButtonsSection text={text} />
            <FormSection text={text} />
            <CardSection text={text} />
            <StatsSection text={text} />
            <TableSection text={text} />
            <PaginationSection text={text} />
            <TabsSection text={text} />
            <AccordionSection text={text} />
            <BreadcrumbSection text={text} />
            <AlertsSection text={text} />
            <FeedbackSection text={text} />
            <OverlaysSection text={text} direction={direction} />
            <EmptyStateSection text={text} />
            <IconsSection text={text} />
        </TooltipProvider>
    );
}
