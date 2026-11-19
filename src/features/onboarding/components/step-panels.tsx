'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Pencil, Search } from 'lucide-react';

import { useUrlLocale } from '@/i18n/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { OnboardingDraft } from '../lib/onboarding-draft';
import { ONBOARDING_LIMITS, subtopicsFor } from '../lib/onboarding-schemas';
import type { OnboardingOptions } from '../services/onboarding.service';
import { PLATFORM_OPTIONS } from '../services/onboarding.service';
import { localizeOptions, localizeTaxonomyLabel } from '../lib/taxonomy-labels';
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
    const t = useTranslations('onboarding');
    const locale = useUrlLocale();
    const backend = options.steps[step];
    const label = backend
        ? localizeTaxonomyLabel(locale, t, 'steps', backend.key, backend.label)
        : t('steps.fallbackTitle', { step: step + 1 });
    return (
        <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">{label}</h2>
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
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
                type="search"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                aria-label={placeholder}
                className="h-11 ps-9"
            />
        </div>
    );
}

function toggleValue(values: string[], value: string): string[] {
    return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
}

export function NicheStep({ draft, options, onChange }: StepProps) {
    const [query, setQuery] = React.useState('');
    const t = useTranslations('onboarding');
    const locale = useUrlLocale();
    const all = localizeOptions(
        locale,
        t,
        'niches',
        options.niches.map((entry) => ({ value: entry.slug, label: entry.label }))
    );
    const filtered = query
        ? all.filter((entry) => entry.label.toLowerCase().includes(query.toLowerCase()))
        : all;

    return (
        <div className="space-y-4">
            <StepHeading step={0} options={options} />
            <p className="text-sm text-muted-foreground">{t('steps.niche.description')}</p>
            {shouldOfferSearch(all.length) ? (
                <SearchField value={query} onChange={setQuery} placeholder={t('steps.niche.search')} />
            ) : null}
            <OptionGrid
                mode="single"
                label={t('steps.niche.label')}
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
    const t = useTranslations('onboarding');
    const locale = useUrlLocale();
    const all = localizeOptions(locale, t, 'subtopics', subtopicsFor(options, draft.niche));
    const filtered = query
        ? all.filter((entry) => entry.label.toLowerCase().includes(query.toLowerCase()))
        : all;
    const max = options.constraints?.maxSubtopics ?? ONBOARDING_LIMITS.maxSubtopics;
    const min = options.constraints?.minSubtopics ?? ONBOARDING_LIMITS.minSubtopics;

    return (
        <div className="space-y-4">
            <StepHeading step={1} options={options} />
            <p className="text-sm text-muted-foreground">
                {t('steps.subtopics.description', { min, max, count: draft.subtopics.length })}
            </p>
            {shouldOfferSearch(all.length) ? (
                <SearchField value={query} onChange={setQuery} placeholder={t('steps.subtopics.search')} />
            ) : null}
            <OptionGrid
                mode="multiple"
                label={t('steps.subtopics.label')}
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
    const t = useTranslations('onboarding');
    const locale = useUrlLocale();
    const max = options.constraints?.maxPlatforms ?? ONBOARDING_LIMITS.maxPlatforms;

    return (
        <div className="space-y-4">
            <StepHeading step={2} options={options} />
            <p className="text-sm text-muted-foreground">{t('steps.platforms.description', { max })}</p>
            <OptionGrid
                mode="multiple"
                label={t('steps.platforms.label')}
                options={localizeOptions(locale, t, 'platforms', PLATFORM_OPTIONS)}
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
    const t = useTranslations('onboarding');
    const locale = useUrlLocale();
    return (
        <div className="space-y-4">
            <StepHeading step={3} options={options} />
            <p className="text-sm text-muted-foreground">{t('steps.experience.description')}</p>
            <OptionGrid
                mode="single"
                label={t('steps.experience.label')}
                columns={1}
                options={localizeOptions(locale, t, 'experience', options.experienceLevels)}
                selected={draft.experience ? [draft.experience] : []}
                onToggle={(value) => onChange({ experience: value })}
            />
        </div>
    );
}

export function GoalsStep({ draft, options, onChange }: StepProps) {
    const t = useTranslations('onboarding');
    const locale = useUrlLocale();
    return (
        <div className="space-y-4">
            <StepHeading step={4} options={options} />
            <p className="text-sm text-muted-foreground">{t('steps.goals.description')}</p>
            <OptionGrid
                mode="multiple"
                label={t('steps.goals.label')}
                options={localizeOptions(locale, t, 'goals', options.goals)}
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
    const t = useTranslations('onboarding');
    const locale = useUrlLocale();
    const empty = t('review.empty');
    const niche = options.niches.find((entry) => entry.slug === draft.niche);
    const nicheLabel = niche
        ? localizeTaxonomyLabel(locale, t, 'niches', niche.slug, niche.label)
        : empty;
    const experience = options.experienceLevels.find((entry) => entry.value === draft.experience);
    const experienceLabel = experience
        ? localizeTaxonomyLabel(locale, t, 'experience', experience.value, experience.label)
        : empty;
    const subtopics = localizeOptions(locale, t, 'subtopics', subtopicsFor(options, draft.niche));
    const goals = localizeOptions(locale, t, 'goals', options.goals);
    const platforms = localizeOptions(locale, t, 'platforms', PLATFORM_OPTIONS);
    const goalLabels = draft.goals.map(
        (goal) => goals.find((entry) => entry.value === goal)?.label ?? goal
    );
    const platformLabels = draft.platforms.map(
        (platform) => platforms.find((entry) => entry.value === platform)?.label ?? platform
    );
    const subtopicLabels = draft.subtopics.map(
        (topic) => subtopics.find((entry) => entry.value === topic)?.label ?? topic
    );

    const rows: { step: number; label: string; value: string }[] = [
        { step: 0, label: t('review.niche'), value: nicheLabel },
        { step: 1, label: t('review.subtopics'), value: subtopicLabels.join(', ') || empty },
        { step: 2, label: t('review.platforms'), value: platformLabels.join(', ') || empty },
        { step: 3, label: t('review.experience'), value: experienceLabel },
        { step: 4, label: t('review.goals'), value: goalLabels.join(', ') || empty },
    ];

    return (
        <div className="space-y-4">
            <StepHeading step={5} options={options} />
            <p className="text-sm text-muted-foreground">{t('steps.review.description')}</p>
            <dl className="divide-y rounded-lg border">
                {rows.map((row) => (
                    <div key={row.step} className="flex items-start justify-between gap-4 p-3">
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
                            {t('steps.review.edit')}
                            <span className="sr-only"> {row.label}</span>
                        </Button>
                    </div>
                ))}
            </dl>
        </div>
    );
}
