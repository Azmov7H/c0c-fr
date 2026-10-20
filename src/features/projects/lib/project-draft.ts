import type { ProjectFormValues } from './project-schemas';
import { projectFormSchema } from './project-schemas';

/**
 * The idea field can be 5,000 characters of unrecoverable thinking, so the
 * wizard writes it to `sessionStorage` as the user types and offers it back on
 * return (T15 §2). Session scope, not local: closing the tab ends the draft.
 *
 * Only form fields are stored. No token, user id or other auth material ever
 * enters this key, and it is cleared the moment a project is created or the
 * user explicitly discards it.
 */
export const PROJECT_DRAFT_KEY = 'c0c:projects:new-draft:v1';

export interface ProjectDraft {
    values: Partial<ProjectFormValues>;
    step: 1 | 2 | 3;
    savedAt: string;
}

interface StoredDraft {
    values?: Record<string, unknown>;
    step?: unknown;
    savedAt?: unknown;
}

const asString = (value: unknown): string => (typeof value === 'string' ? value : '');

export function readProjectDraft(storage: Storage): ProjectDraft | null {
    try {
        const raw = storage.getItem(PROJECT_DRAFT_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw) as StoredDraft;
        const values: Partial<ProjectFormValues> = {
            title: asString(parsed.values?.title),
            description: asString(parsed.values?.description),
            idea: asString(parsed.values?.idea),
        };

        const platform = parsed.values?.platform;
        const tone = parsed.values?.tone;
        if (platform === 'youtube' || platform === 'tiktok' || platform === 'instagram') {
            values.platform = platform;
        }
        if (
            tone === 'educational' ||
            tone === 'dramatic' ||
            tone === 'viral' ||
            tone === 'storytelling' ||
            tone === 'casual' ||
            tone === 'professional'
        ) {
            values.tone = tone;
        }

        const step = parsed.step === 2 || parsed.step === 3 ? parsed.step : 1;
        const savedAt =
            typeof parsed.savedAt === 'string' && !Number.isNaN(Date.parse(parsed.savedAt))
                ? parsed.savedAt
                : new Date().toISOString();

        return { values, step, savedAt };
    } catch {
        return null;
    }
}

export function writeProjectDraft(
    storage: Storage,
    values: Partial<ProjectFormValues>,
    step: 1 | 2 | 3
): void {
    try {
        const draft: ProjectDraft = {
            values,
            step,
            savedAt: new Date().toISOString(),
        };
        storage.setItem(PROJECT_DRAFT_KEY, JSON.stringify(draft));
    } catch {
        // Storage can be full or disabled (private mode). Autosave is a safety
        // net, not a requirement — never block the wizard on it.
    }
}

export function clearProjectDraft(storage: Storage): void {
    try {
        storage.removeItem(PROJECT_DRAFT_KEY);
    } catch {
        // See writeProjectDraft.
    }
}

export function draftIsEmpty(values: Partial<ProjectFormValues>): boolean {
    return !values.title?.trim() && !values.description?.trim() && !values.idea?.trim();
}

/**
 * Values from a draft are allowed to be incomplete — people navigate away
 * mid-sentence — so restoring must not require a passing submit schema.
 */
export function canRestoreDraft(draft: ProjectDraft | null): draft is ProjectDraft {
    return Boolean(draft && !draftIsEmpty(draft.values));
}

export function draftMatchesSchema(draft: ProjectDraft): boolean {
    return projectFormSchema.safeParse(draft.values).success;
}
