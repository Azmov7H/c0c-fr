import type { useTranslations } from 'next-intl';

import type { ContentTone, Platform, ProjectStatus } from '@/types';

import type { ProjectMemberRole, ProjectRole } from '../types';
import type { ProjectSort } from './project-filters';

/**
 * AR-030 — the projects-surface vocabulary overlay.
 *
 * The English words are data in `project-constants.ts` (`PLATFORM_CHOICES`,
 * `TONE_CHOICES`, `STATUS_LABEL`, `PROJECT_SORTS`, …) — the regression floor
 * for every call site and the source the English floor test pins against. The
 * `messages/{en,ar}/projects.json` catalogs carry the translations.
 *
 * Components read the catalog through the overlay below: a switch over the
 * value whose arms call `t` with a literal key — every catalog key is
 * statically referenced, so `scripts/i18n/extract-usage.mjs` can check each
 * one. The catalog is the single source of the Arabic; the English data in
 * `project-constants.ts` stays the floor.
 */
export type ProjectsTranslator = ReturnType<typeof useTranslations<'projects'>>;

export function platformLabel(t: ProjectsTranslator, platform: Platform): string {
    switch (platform) {
        case 'youtube':
            return t('vocab.platforms.youtube.label');
        case 'tiktok':
            return t('vocab.platforms.tiktok.label');
        case 'instagram':
            return t('vocab.platforms.instagram.label');
        case 'facebook':
            return t('vocab.platforms.facebook.label');
    }
}

/** The wizard radio cards read the per-platform summary + affects copy. */
export function platformSummary(t: ProjectsTranslator, platform: Platform): string {
    switch (platform) {
        case 'youtube':
            return t('vocab.platforms.youtube.summary');
        case 'tiktok':
            return t('vocab.platforms.tiktok.summary');
        case 'instagram':
            return t('vocab.platforms.instagram.summary');
        case 'facebook':
            return t('vocab.platforms.facebook.summary');
    }
}

export function platformAffects(t: ProjectsTranslator, platform: Platform): string {
    switch (platform) {
        case 'youtube':
            return t('vocab.platforms.youtube.affects');
        case 'tiktok':
            return t('vocab.platforms.tiktok.affects');
        case 'instagram':
            return t('vocab.platforms.instagram.affects');
        case 'facebook':
            return t('vocab.platforms.facebook.affects');
    }
}

export function toneLabel(t: ProjectsTranslator, tone: ContentTone): string {
    switch (tone) {
        case 'educational':
            return t('vocab.tones.educational');
        case 'dramatic':
            return t('vocab.tones.dramatic');
        case 'viral':
            return t('vocab.tones.viral');
        case 'storytelling':
            return t('vocab.tones.storytelling');
        case 'casual':
            return t('vocab.tones.casual');
        case 'professional':
            return t('vocab.tones.professional');
    }
}

export function toneDescription(t: ProjectsTranslator, tone: ContentTone): string {
    switch (tone) {
        case 'educational':
            return t('vocab.tonesDescriptions.educational');
        case 'dramatic':
            return t('vocab.tonesDescriptions.dramatic');
        case 'viral':
            return t('vocab.tonesDescriptions.viral');
        case 'storytelling':
            return t('vocab.tonesDescriptions.storytelling');
        case 'casual':
            return t('vocab.tonesDescriptions.casual');
        case 'professional':
            return t('vocab.tonesDescriptions.professional');
    }
}

/** The count is printed separately by the caller; this returns only the noun. */
export function projectNoun(t: ProjectsTranslator, count: number): string {
    return count === 1 ? t('vocab.projectNoun.one') : t('vocab.projectNoun.other');
}

export function stepLabel(t: ProjectsTranslator, step: 1 | 2 | 3 | 4): string {
    switch (step) {
        case 1:
            return t('wizard.stepLabels.details');
        case 2:
            return t('wizard.stepLabels.platformTone');
        case 3:
            return t('wizard.stepLabels.configuration');
        case 4:
            return t('wizard.stepLabels.review');
    }
}

export function stepDescription(t: ProjectsTranslator, step: 1 | 2 | 3 | 4): string {
    switch (step) {
        case 1:
            return t('wizard.stepDescriptions.details');
        case 2:
            return t('wizard.stepDescriptions.platformTone');
        case 3:
            return t('wizard.stepDescriptions.configuration');
        case 4:
            return t('wizard.stepDescriptions.review');
    }
}

export function formatLabel(t: ProjectsTranslator, format: 'long' | 'short'): string {
    switch (format) {
        case 'long':
            return t('vocab.formats.long.label');
        case 'short':
            return t('vocab.formats.short.label');
    }
}

export function formatDescription(t: ProjectsTranslator, format: 'long' | 'short'): string {
    switch (format) {
        case 'long':
            return t('vocab.formats.long.description');
        case 'short':
            return t('vocab.formats.short.description');
    }
}

export function statusLabel(t: ProjectsTranslator, status: ProjectStatus): string {
    switch (status) {
        case 'draft':
            return t('vocab.statuses.draft');
        case 'processing':
            return t('vocab.statuses.processing');
        case 'completed':
            return t('vocab.statuses.completed');
        case 'archived':
            return t('vocab.statuses.archived');
    }
}

export function sortLabel(t: ProjectsTranslator, sort: ProjectSort['value']): string {
    switch (sort) {
        case 'updatedAt':
            return t('vocab.sorts.updatedAt');
        case 'createdAt':
            return t('vocab.sorts.createdAt');
        case 'title':
            return t('vocab.sorts.title');
        case 'status':
            return t('vocab.sorts.status');
    }
}

export function roleLabel(t: ProjectsTranslator, role: ProjectRole): string {
    switch (role) {
        case 'owner':
            return t('vocab.roles.owner');
        case 'editor':
            return t('vocab.roles.editor');
        case 'commenter':
            return t('vocab.roles.commenter');
        case 'viewer':
            return t('vocab.roles.viewer');
    }
}

export function roleDescription(t: ProjectsTranslator, role: ProjectMemberRole): string {
    switch (role) {
        case 'editor':
            return t('vocab.roleDescriptions.editor');
        case 'commenter':
            return t('vocab.roleDescriptions.commenter');
        case 'viewer':
            return t('vocab.roleDescriptions.viewer');
    }
}
