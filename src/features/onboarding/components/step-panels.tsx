'use client';

import * as React from 'react';
import { Pencil, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { OnboardingDraft } from '../lib/onboarding-draft';
import { ONBOARDING_LIMITS, subtopicsFor } from '../lib/onboarding-schemas';
import type { OnboardingOptions } from '../services/onboarding.service';
import { PLATFORM_OPTIONS } from '../services/onboarding.service';
import { OptionGrid } from './option-grid';

/**
 * A search field appears only when a list is long enough to need one (card §3:
 * "search/filter when the list exceeds ~15 items"). The niche list is short and
 * shows no field; the subtopic union is long and does.
 */
export const SEARCH_THRESHOLD = 15;

export function shouldOfferSearch(count: number, threshold: number = SEARCH_THRESHOLD): boolean {
    return count > threshold;
}

interface StepProps {
    draft: OnboardingDraft;
    options: OnboardingOptions;
    onChange: (patch: Partial<OnboardingDraft>) => void;
}

function StepHeading({ step, options }: { step: number; options: OnboardingOptions }) {
    return (
        <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">
                {options.steps[step]?.label ?? `Step ${step + 1}`}
            </h2>
        </div>
    );
}

function SearchField({
    value,
    onChange,
    placeholder,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}) {
    return (
        <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
                type="search"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                aria-label={placeholder}
                className="h-11 pl-9"
            />
        </div>
    );
}

function toggleValue(values: string[], value: string): string[] {
    return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
}

export function NicheStep({ draft, options, onChange }: StepProps) {
    const [query, setQuery] = React.useState('');
    const all = options.niches.map((entry) => ({ value: entry.slug, label: entry.label }));
    const filtered = query
        ? all.filter((entry) => entry.label.toLowerCase().includes(query.toLowerCase()))
        : all;

    return (
        <div className="space-y-4">
            <StepHeading step={0} options={options} />
            <p className="text-sm text-muted-foreground">Pick the one that fits you best.</p>
            {shouldOfferSearch(all.length) ? (
                <SearchField value={query} onChange={setQuery} placeholder="Search niches" />
            ) : null}
            <OptionGrid
                mode="single"
                label="Niche"
                options={filtered}
                selected={draft.niche ? [draft.niche] : []}
                onToggle={(value) =>
                    onChange({
                        niche: value,
                        // Subtopics belong to a niche; changing it clears the old picks.
                        subtopics: value === draft.niche ? draft.subtopics : [],
                    })
                }
            />
        </div>
    );
}

export function SubtopicsStep({ draft, options, onChange }: StepProps) {
    const [query, setQuery] = React.useState('');
    const all = subtopicsFor(options, draft.niche);
    const filtered = query
        ? all.filter((entry) => entry.label.toLowerCase().includes(query.toLowerCase()))
        : all;
    const max = options.constraints?.maxSubtopics ?? ONBOARDING_LIMITS.maxSubtopics;
    const min = options.constraints?.minSubtopics ?? ONBOARDING_LIMITS.minSubtopics;

    return (
        <div className="space-y-4">
            <StepHeading step={1} options={options} />
            <p className="text-sm text-muted-foreground">
                Choose {min}–{max}. You have picked {draft.subtopics.length}.
            </p>
            {shouldOfferSearch(all.length) ? (
                <SearchField value={query} onChange={setQuery} placeholder="Search subtopics" />
            ) : null}
            <OptionGrid
                mode="multiple"
                label="Subtopics"
                options={filtered}
                selected={draft.subtopics}
                max={max}
                onToggle={(value) =>
                    onChange({
                        subtopics: draft.subtopics.includes(value)
                            ? draft.subtopics.filter((entry) => entry !== value)
                            : draft.subtopics.length < max
                              ? [...draft.subtopics, value]
                              : draft.subtopics,
                    })
                }
            />
        </div>
    );
}

export function PlatformsStep({ draft, options, onChange }: StepProps) {
    const max = options.constraints?.maxPlatforms ?? ONBOARDING_LIMITS.maxPlatforms;

    return (
        <div className="space-y-4">
            <StepHeading step={2} options={options} />
            <p className="text-sm text-muted-foreground">Pick up to {max}.</p>
            <OptionGrid
                mode="multiple"
                label="Platforms"
                options={PLATFORM_OPTIONS.map((entry) => ({ value: entry.value, label: entry.label }))}
                selected={draft.platforms}
                max={max}
                onToggle={(value) =>
                    onChange({ platforms: toggleValue(draft.platforms, value) as OnboardingDraft['platforms'] })
                }
            />
        </div>
    );
}

export function ExperienceStep({ draft, options, onChange }: StepProps) {
    return (
        <div className="space-y-4">
            <StepHeading step={3} options={options} />
            <p className="text-sm text-muted-foreground">This tunes the depth of what we suggest first.</p>
            <OptionGrid
                mode="single"
                label="Experience level"
                columns={1}
                options={options.experienceLevels.map((entry) => ({ value: entry.value, label: entry.label }))}
                selected={draft.experience ? [draft.experience] : []}
                onToggle={(value) => onChange({ experience: value })}
            />
        </div>
    );
}

export function GoalsStep({ draft, options, onChange }: StepProps) {
    return (
        <div className="space-y-4">
            <StepHeading step={4} options={options} />
            <p className="text-sm text-muted-foreground">Pick everything that applies.</p>
            <OptionGrid
                mode="multiple"
                label="Goals"
                options={options.goals.map((entry) => ({ value: entry.value, label: entry.label }))}
                selected={draft.goals}
                onToggle={(value) => onChange({ goals: toggleValue(draft.goals, value) })}
            />
        </div>
    );
}

export function ReviewStep({
    draft,
    options,
    onEdit,
}: {
    draft: OnboardingDraft;
    options: OnboardingOptions;
    onEdit: (step: number) => void;
}) {
    const nicheLabel = options.niches.find((entry) => entry.slug === draft.niche)?.label ?? '—';
    const experienceLabel =
        options.experienceLevels.find((entry) => entry.value === draft.experience)?.label ?? '—';
    const goalLabels = draft.goals.map(
        (goal) => options.goals.find((entry) => entry.value === goal)?.label ?? goal
    );
    const platformLabels = draft.platforms.map(
        (platform) => PLATFORM_OPTIONS.find((entry) => entry.value === platform)?.label ?? platform
    );

    const rows: { step: number; label: string; value: string }[] = [
        { step: 0, label: 'Niche', value: nicheLabel },
        { step: 1, label: 'Subtopics', value: draft.subtopics.join(', ') || '—' },
        { step: 2, label: 'Platforms', value: platformLabels.join(', ') || '—' },
        { step: 3, label: 'Experience', value: experienceLabel },
        { step: 4, label: 'Goals', value: goalLabels.join(', ') || '—' },
    ];

    return (
        <div className="space-y-4">
            <StepHeading step={5} options={options} />
            <p className="text-sm text-muted-foreground">
                Check everything over — you can change any answer before finishing.
            </p>
            <dl className="divide-y rounded-lg border">
                {rows.map((row) => (
                    <div key={row.label} className="flex items-start justify-between gap-4 p-3">
                        <div className="min-w-0">
                            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                {row.label}
                            </dt>
                            <dd className="mt-0.5 text-sm">{row.value}</dd>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="min-h-11 gap-1.5"
                            onClick={() => onEdit(row.step)}
                        >
                            <Pencil className="size-3.5" aria-hidden="true" />
                            Edit
                            <span className="sr-only"> {row.label}</span>
                        </Button>
                    </div>
                ))}
            </dl>
        </div>
    );
}
