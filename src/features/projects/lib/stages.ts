import type { ContentTone, Platform, Project } from '@/types';
import type { Script } from '@/features/scripts/types';
import type { Thumbnail } from '@/features/thumbnails/types';
import { audioLayerOf, type AudioSuggestion } from '@/features/audio/types';
import type { MediaItem } from '@/features/media/services/media.service';
import type { ExportRecordView } from '@/features/projects/services/export.service';

/**
 * P11.1 — the derived stage model (D12.B).
 *
 * There is NO stored workflow state: a stage is complete because the
 * ASSETS it produces exist. The derivation is a pure function of what the
 * server returned, so the stepper can never drift from the assets tab, the
 * media tab or the export ledger — they all read the same records.
 *
 * The stages link INTO the existing workspace surfaces (the tabs stay).
 * Nothing here re-implements a decision that lives elsewhere: the project
 * configuration is read from the project, the allowance from the server,
 * the price from the server.
 */

export type StageId =
    | 'creation'
    | 'configuration'
    | 'script'
    | 'script-edit'
    | 'thumbnail'
    | 'scene-images'
    | 'narration'
    | 'sfx'
    | 'preview'
    | 'export';

export type StageTab = 'assets' | 'media' | 'preview';

export interface StageDefinition {
    id: StageId;
    label: string;
    /** The workspace tab that performs the stage. */
    tab: StageTab;
    /**
     * The panel's anchor on that tab, so a deep link lands on the control
     * that performs the stage (a native `#anchor` — no scroll script).
     */
    anchor?: string;
    /**
     * Ready = the backing capability passed its own readiness check on its
     * own branch (IMPLEMENTATION-PLAN §6). A stage that is not ready is
     * ABSENT from the stepper — hidden, never a greyed placeholder.
     */
    ready: boolean;
}

export interface StageState extends StageDefinition {
    /** The stage's work is done (derived from the assets). */
    complete: boolean;
    /** Why the stage cannot be started yet — null when it can. */
    blockedReason: string | null;
    /** A short, honest line about what is there (never a promise). */
    detail: string;
}

/**
 * AR-031 — the copy the derivation needs, supplied by the caller.
 *
 * `deriveStages` stays a pure function of the server's records: it decides
 * WHICH stages exist and WHAT each one's state is, but it no longer owns the
 * English words. A caller that passes no messages gets the original English
 * copy (the regression floor the pure-data tests pin); the workspace hook
 * passes the same sentences read from `messages/{en,ar}/workspace.json`.
 */
export interface StageMessages {
    labels: Record<StageId, string>;
    creationDetail: (title: string) => string;
    creationEmpty: string;
    configurationDetail: (platform: Platform, tone: ContentTone, duration: string) => string;
    configurationDuration: (seconds: number) => string;
    configurationEmpty: string;
    scriptDetail: (scenes: number, version: number) => string;
    scriptEmpty: string;
    scriptEditBlocked: string;
    scriptEditEdited: (version: number) => string;
    scriptEditNotEdited: (version: number) => string;
    scriptEditEmpty: string;
    thumbnailReady: string;
    thumbnailEmpty: string;
    sceneImagesDetail: (filled: number, slots: number) => string;
    narrationReady: string;
    narrationEmpty: string;
    sfxDetail: (count: number) => string;
    sfxEmpty: string;
    previewBlocked: string;
    previewReady: string;
    previewPartial: string;
    exportBlocked: string;
    exportReady: string;
    exportEmpty: string;
}

/** The verbatim pre-AR-031 English — the floor, and the no-provider default. */
export const EN_STAGE_MESSAGES: StageMessages = {
    labels: {
        creation: 'Project',
        configuration: 'Configuration',
        script: 'Script',
        'script-edit': 'Script edit',
        thumbnail: 'Thumbnail',
        'scene-images': 'Scene images',
        narration: 'Narration',
        sfx: 'Sound effects',
        preview: 'Preview',
        export: 'Export',
    },
    creationDetail: (title) => title,
    creationEmpty: 'No project loaded',
    configurationDetail: (platform, tone, duration) => `${platform} · ${tone}${duration}`,
    configurationDuration: (seconds) => ` · ${seconds}s`,
    configurationEmpty: 'Not configured',
    scriptDetail: (scenes, version) => `${scenes} scene(s) · version ${version}`,
    scriptEmpty: 'No script yet',
    scriptEditBlocked: 'Generate the script first',
    scriptEditEdited: (version) => `Edited · version ${version}`,
    scriptEditNotEdited: (version) => `Not edited yet · version ${version}`,
    scriptEditEmpty: 'No script to edit',
    thumbnailReady: 'Thumbnail ready',
    thumbnailEmpty: 'No thumbnail yet',
    sceneImagesDetail: (filled, slots) => `${filled} of ${slots} image slot(s) filled`,
    narrationReady: 'Narration ready',
    narrationEmpty: 'No narration yet',
    sfxDetail: (count) => `${count} effect layer(s) ready`,
    sfxEmpty: 'No sound effects yet',
    previewBlocked: 'Finish the asset stages to preview the whole project',
    previewReady: 'Everything is in place',
    previewPartial: 'Shows what exists so far',
    exportBlocked: 'Generate a script to export',
    exportReady: 'Exported at least once',
    exportEmpty: 'Not exported yet',
};

export const WORKFLOW_STAGES: readonly StageDefinition[] = [
    { id: 'creation', label: EN_STAGE_MESSAGES.labels.creation, tab: 'assets', ready: true },
    { id: 'configuration', label: EN_STAGE_MESSAGES.labels.configuration, tab: 'assets', ready: true },
    { id: 'script', label: EN_STAGE_MESSAGES.labels.script, tab: 'assets', anchor: 'scripts', ready: true },
    { id: 'script-edit', label: EN_STAGE_MESSAGES.labels['script-edit'], tab: 'assets', anchor: 'scripts', ready: true },
    { id: 'thumbnail', label: EN_STAGE_MESSAGES.labels.thumbnail, tab: 'media', anchor: 'thumbnail', ready: true },
    { id: 'scene-images', label: EN_STAGE_MESSAGES.labels['scene-images'], tab: 'media', anchor: 'gallery', ready: true },
    { id: 'narration', label: EN_STAGE_MESSAGES.labels.narration, tab: 'media', anchor: 'narration', ready: true },
    { id: 'sfx', label: EN_STAGE_MESSAGES.labels.sfx, tab: 'media', anchor: 'effects', ready: true },
    { id: 'preview', label: EN_STAGE_MESSAGES.labels.preview, tab: 'preview', ready: true },
    { id: 'export', label: EN_STAGE_MESSAGES.labels.export, tab: 'assets', anchor: 'export', ready: true },
];

export interface WorkflowSnapshot {
    project: Project | undefined;
    scripts: Script[];
    thumbnails: Thumbnail[];
    audio: AudioSuggestion[];
    media: MediaItem[];
    exports: ExportRecordView[];
}

const GALLERY_SLOTS = 3;

const latestScript = (scripts: Script[]): Script | undefined =>
    [...scripts]
        .filter((script) => !script.isDeleted)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

const galleryImages = (media: MediaItem[]): MediaItem[] =>
    media.filter(
        (item) =>
            item.category === 'image' &&
            item.metadata &&
            typeof (item.metadata as { slot?: unknown }).slot === 'number'
    );

const layerWithFile = (audio: AudioSuggestion[], layer: 'narration' | 'music' | 'sfx') =>
    audio.some(
        (row) => audioLayerOf(row) === layer && !row.isDeleted && Boolean(row.fileUrl)
    );

const completedThumbnail = (thumbnails: Thumbnail[]): Thumbnail | undefined =>
    [...thumbnails]
        .filter((t) => t.status === 'completed' && t.imageUrl)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

/**
 * Derive every stage from the assets that exist.
 *
 * Blocking is deliberately minimal: a stage is blocked only when the
 * server itself would refuse it. The audio generation falls back to the
 * project idea when there is no script, and a thumbnail is generated from
 * the idea too — so neither is gated on the script, and the stepper never
 * locks a surface that would work.
 */
export function deriveStages(
    snapshot: WorkflowSnapshot,
    messages: StageMessages = EN_STAGE_MESSAGES
): StageState[] {
    const script = latestScript(snapshot.scripts);
    const hasScript = Boolean(script && script.sections.length > 0);
    const edited = Boolean(script && script.version > 1);
    const thumbnail = completedThumbnail(snapshot.thumbnails);
    const images = galleryImages(snapshot.media);
    const narration = layerWithFile(snapshot.audio, 'narration');
    const effects = snapshot.audio.filter(
        (row) =>
            (audioLayerOf(row) === 'sfx' || audioLayerOf(row) === 'music') &&
            !row.isDeleted &&
            Boolean(row.fileUrl)
    );
    const exported = snapshot.exports.some((record) => record.status === 'completed');

    const configuration = snapshot.project?.platform && snapshot.project?.tone;

    const states: Record<StageId, Omit<StageState, keyof StageDefinition>> = {
        creation: {
            complete: Boolean(snapshot.project),
            blockedReason: null,
            detail: snapshot.project
                ? messages.creationDetail(snapshot.project.title)
                : messages.creationEmpty,
        },
        configuration: {
            complete: Boolean(configuration),
            blockedReason: null,
            detail: snapshot.project
                ? messages.configurationDetail(
                      snapshot.project.platform,
                      snapshot.project.tone,
                      snapshot.project.durationSeconds
                          ? messages.configurationDuration(snapshot.project.durationSeconds)
                          : ''
                  )
                : messages.configurationEmpty,
        },
        script: {
            complete: hasScript,
            blockedReason: null,
            detail: hasScript && script
                ? messages.scriptDetail(script.sections.length, script.version)
                : messages.scriptEmpty,
        },
        'script-edit': {
            complete: edited,
            blockedReason: hasScript ? null : messages.scriptEditBlocked,
            detail: script
                ? edited
                    ? messages.scriptEditEdited(script.version)
                    : messages.scriptEditNotEdited(script.version)
                : messages.scriptEditEmpty,
        },
        thumbnail: {
            complete: Boolean(thumbnail),
            blockedReason: null,
            detail: thumbnail ? messages.thumbnailReady : messages.thumbnailEmpty,
        },
        'scene-images': {
            complete: images.length > 0,
            blockedReason: null,
            detail: messages.sceneImagesDetail(images.length, GALLERY_SLOTS),
        },
        narration: {
            complete: narration,
            blockedReason: null,
            detail: narration ? messages.narrationReady : messages.narrationEmpty,
        },
        sfx: {
            complete: effects.length > 0,
            blockedReason: null,
            detail: effects.length ? messages.sfxDetail(effects.length) : messages.sfxEmpty,
        },
        preview: {
            complete: hasScript && Boolean(thumbnail) && images.length > 0 && narration,
            blockedReason:
                hasScript && thumbnail && images.length > 0 && narration
                    ? null
                    : messages.previewBlocked,
            detail:
                hasScript && thumbnail && images.length > 0 && narration
                    ? messages.previewReady
                    : messages.previewPartial,
        },
        export: {
            complete: exported,
            blockedReason: hasScript ? null : messages.exportBlocked,
            detail: exported ? messages.exportReady : messages.exportEmpty,
        },
    };

    return WORKFLOW_STAGES.filter((definition) => definition.ready).map((definition) => ({
        ...definition,
        label: messages.labels[definition.id],
        ...states[definition.id],
    }));
}

/** The stage the guided path is waiting on: the first incomplete one. */
export function currentStageId(stages: StageState[]): StageId | null {
    return stages.find((stage) => !stage.complete)?.id ?? null;
}

/** How far along the path is (completed stages / total). */
export function workflowProgress(stages: StageState[]): { done: number; total: number } {
    return { done: stages.filter((stage) => stage.complete).length, total: stages.length };
}

/** The deep link for a stage: the tab that performs it, anchored by stage. */
export function stageHref(projectId: string, stage: StageState): string {
    const query = new URLSearchParams();
    if (stage.tab !== 'assets') query.set('tab', stage.tab);
    query.set('stage', stage.id);
    const anchor = stage.anchor ? `#${stage.anchor}` : '';
    return `/projects/${projectId}?${query.toString()}${anchor}`;
}
