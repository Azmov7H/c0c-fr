import type { useTranslations } from 'next-intl';

import type { AppLocale } from '@/i18n/routing';
import { formatAbsoluteTime, formatRelativeTime } from '@/lib/relative-time';

import type {
    ExportRecordStatus,
    ExportRecordView,
    ExportScope,
} from '../services/export.service';
import type { InviteState, ProjectActivityType } from '../types';
import {
    platformLabel,
    toneLabel,
    type ProjectsTranslator,
} from './projects-labels';
import type { StageMessages } from './stages';
import type { WorkspaceTab } from '../components/workspace/workspace-tabs';

/**
 * AR-031 — the workspace vocabulary overlay.
 *
 * Every value that is an enum or a code (a stage id, an activity type, an
 * export scope, an invite state) reaches its catalog through a switch whose
 * arms are LITERAL keys passed straight to `t`. `scripts/i18n/extract-usage.mjs` cannot see a
 * dynamic key, so a helper like this is the only way a translated vocabulary
 * can be both complete and checked. The server values and wire codes are never
 * translated; only the human label reading them is.
 */
export type WorkspaceTranslator = ReturnType<typeof useTranslations<'workspace'>>;

/** The catalog-backed copy for the derived workflow stages. */
export function stageMessages(t: WorkspaceTranslator, tp: ProjectsTranslator): StageMessages {
    return {
        labels: {
            creation: t('workflow.stages.creation.label'),
            configuration: t('workflow.stages.configuration.label'),
            script: t('workflow.stages.script.label'),
            'script-edit': t('workflow.stages.scriptEdit.label'),
            thumbnail: t('workflow.stages.thumbnail.label'),
            'scene-images': t('workflow.stages.sceneImages.label'),
            narration: t('workflow.stages.narration.label'),
            sfx: t('workflow.stages.sfx.label'),
            preview: t('workflow.stages.preview.label'),
            export: t('workflow.stages.export.label'),
        },
        creationDetail: (title) => t('workflow.stages.creation.detail', { title }),
        creationEmpty: t('workflow.stages.creation.empty'),
        // The raw English floor prints the platform/tone codes in lower case.
        // `*.Label` returns "YouTube"/"Educational"; lower-casing is a no-op
        // for Arabic, so the same path gives translated words in /ar.
        configurationDetail: (platform, tone, duration) =>
            t('workflow.stages.configuration.detail', {
                platform: platformLabel(tp, platform).toLowerCase(),
                tone: toneLabel(tp, tone).toLowerCase(),
                duration,
            }),
        configurationDuration: (seconds) =>
            t('workflow.stages.configuration.duration', { seconds }),
        configurationEmpty: t('workflow.stages.configuration.empty'),
        scriptDetail: (scenes, version) =>
            t('workflow.stages.script.detail', { scenes, version }),
        scriptEmpty: t('workflow.stages.script.empty'),
        scriptEditBlocked: t('workflow.stages.scriptEdit.blocked'),
        scriptEditEdited: (version) => t('workflow.stages.scriptEdit.edited', { version }),
        scriptEditNotEdited: (version) =>
            t('workflow.stages.scriptEdit.notEdited', { version }),
        scriptEditEmpty: t('workflow.stages.scriptEdit.empty'),
        thumbnailReady: t('workflow.stages.thumbnail.ready'),
        thumbnailEmpty: t('workflow.stages.thumbnail.empty'),
        sceneImagesDetail: (filled, slots) =>
            t('workflow.stages.sceneImages.detail', { filled, slots }),
        narrationReady: t('workflow.stages.narration.ready'),
        narrationEmpty: t('workflow.stages.narration.empty'),
        sfxDetail: (count) => t('workflow.stages.sfx.detail', { count }),
        sfxEmpty: t('workflow.stages.sfx.empty'),
        previewBlocked: t('workflow.stages.preview.blocked'),
        previewReady: t('workflow.stages.preview.ready'),
        previewPartial: t('workflow.stages.preview.partial'),
        exportBlocked: t('workflow.stages.export.blocked'),
        exportReady: t('workflow.stages.export.ready'),
        exportEmpty: t('workflow.stages.export.empty'),
    };
}

export type WorkflowState = 'completed' | 'blocked' | 'current' | 'notStarted';

export function workflowStateLabel(t: WorkspaceTranslator, state: WorkflowState): string {
    switch (state) {
        case 'completed':
            return t('workflow.states.completed');
        case 'blocked':
            return t('workflow.states.blocked');
        case 'current':
            return t('workflow.states.current');
        case 'notStarted':
            return t('workflow.states.notStarted');
    }
}

export function workspaceTabLabel(t: WorkspaceTranslator, tab: WorkspaceTab): string {
    switch (tab) {
        case 'assets':
            return t('tabs.assets');
        case 'media':
            return t('tabs.media');
        case 'preview':
            return t('tabs.preview');
        case 'members':
            return t('tabs.members');
        case 'activity':
            return t('tabs.activity');
    }
}

/** The four "still missing" nouns in the preview panel. */
export function missingAssetLabel(
    t: WorkspaceTranslator,
    key: 'script' | 'thumbnail' | 'sceneImages' | 'narration'
): string {
    switch (key) {
        case 'script':
            return t('preview.missing.script');
        case 'thumbnail':
            return t('preview.missing.thumbnail');
        case 'sceneImages':
            return t('preview.missing.sceneImages');
        case 'narration':
            return t('preview.missing.narration');
    }
}

export function activityTypeLabel(t: WorkspaceTranslator, type: ProjectActivityType): string {
    switch (type) {
        case 'member_added':
            return t('activity.types.memberAdded');
        case 'member_removed':
            return t('activity.types.memberRemoved');
        case 'member_role_changed':
            return t('activity.types.roleChanged');
        case 'invite_created':
            return t('activity.types.inviteCreated');
        case 'invite_accepted':
            return t('activity.types.inviteAccepted');
        case 'invite_revoked':
            return t('activity.types.inviteRevoked');
        case 'script_generated':
            return t('activity.types.scriptGenerated');
        case 'thumbnail_generated':
            return t('activity.types.thumbnailGenerated');
        case 'audio_generated':
            return t('activity.types.audioGenerated');
    }
}

export function activityFilterLabel(
    t: WorkspaceTranslator,
    filter: 'all' | ProjectActivityType
): string {
    switch (filter) {
        case 'all':
            return t('activity.filters.all');
        case 'member_added':
            return t('activity.filters.memberAdded');
        case 'member_removed':
            return t('activity.filters.memberRemoved');
        case 'member_role_changed':
            return t('activity.filters.roleChanged');
        case 'invite_created':
            return t('activity.filters.inviteCreated');
        case 'invite_accepted':
            return t('activity.filters.inviteAccepted');
        case 'invite_revoked':
            return t('activity.filters.inviteRevoked');
        case 'script_generated':
            return t('activity.filters.scriptGenerated');
        case 'thumbnail_generated':
            return t('activity.filters.thumbnailGenerated');
        case 'audio_generated':
            return t('activity.filters.audioGenerated');
    }
}

export function exportScopeLabel(t: WorkspaceTranslator, scope: ExportScope): string {
    switch (scope) {
        case 'full':
            return t('export.scopes.full');
        case 'script':
            return t('export.scopes.script');
        case 'images':
            return t('export.scopes.images');
        case 'audio':
            return t('export.scopes.audio');
        case 'media':
            return t('export.scopes.media');
    }
}

export function exportStatusLabel(t: WorkspaceTranslator, status: ExportRecordStatus): string {
    switch (status) {
        case 'completed':
            return t('export.statusCompleted');
        case 'failed':
            return t('export.statusFailed');
        case 'started':
            return t('export.statusInProgress');
    }
}

/** A failed export always explains that no money was taken. */
export function exportFailureNote(t: WorkspaceTranslator, record: ExportRecordView): string | null {
    if (record.status !== 'failed') return null;
    if (record.reason === 'cancelled') return t('export.failureCancelled');
    if (record.reason === 'allowance_reached') return t('export.failureAllowance');
    return t('export.failureNone');
}

export function inviteStateLabel(t: WorkspaceTranslator, state: InviteState): string {
    switch (state) {
        case 'pending':
            return t('members.inviteStates.pending');
        case 'accepted':
            return t('members.inviteStates.accepted');
        case 'revoked':
            return t('members.inviteStates.revoked');
        case 'expired':
            return t('members.inviteStates.expired');
    }
}

/** The invite's remaining lifetime, in the words the roster already uses. */
export function expiryLabel(t: WorkspaceTranslator, iso: string): string {
    const ms = new Date(iso).getTime() - Date.now();
    if (Number.isNaN(ms) || ms <= 0) return t('expiry.expired');
    const hours = Math.floor(ms / 3_600_000);
    if (hours >= 48) return t('expiry.days', { days: Math.floor(hours / 24) });
    if (hours >= 1) return t('expiry.hours', { hours });
    const minutes = Math.max(1, Math.floor(ms / 60_000));
    return t('expiry.minutes', { minutes });
}

/** Only the well-known billing feature gets a word; other codes stay codes. */
export function generationNoun(t: WorkspaceTranslator, feature: string): string {
    switch (feature) {
        case 'ai.generation':
            return t('generation.nouns.generation');
        default:
            return feature;
    }
}

/** Locale-aware formatters carrying the workspace's own invalid-date copy. */
export function workspaceRelativeTime(
    t: WorkspaceTranslator,
    value: string | Date,
    locale: AppLocale,
    now: Date = new Date()
): string {
    return formatRelativeTime(value, locale, now, {
        relative: t('time.unknownTime'),
        absolute: '',
    }).relative;
}

export function workspaceAbsoluteTime(
    t: WorkspaceTranslator,
    value: string | Date,
    locale: AppLocale
): string {
    return formatAbsoluteTime(value, locale, t('time.unknownDate'));
}
