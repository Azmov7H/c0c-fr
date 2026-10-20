import { describe, expect, it } from 'vitest';

import {
    PROJECT_DRAFT_KEY,
    canRestoreDraft,
    clearProjectDraft,
    draftIsEmpty,
    readProjectDraft,
    writeProjectDraft,
} from './project-draft';

class MemoryStorage implements Storage {
    private data = new Map<string, string>();

    get length(): number {
        return this.data.size;
    }

    clear(): void {
        this.data.clear();
    }

    getItem(key: string): string | null {
        return this.data.get(key) ?? null;
    }

    key(index: number): string | null {
        return Array.from(this.data.keys())[index] ?? null;
    }

    removeItem(key: string): void {
        this.data.delete(key);
    }

    setItem(key: string, value: string): void {
        this.data.set(key, value);
    }
}

describe('project draft autosave', () => {
    it('round-trips the form and step', () => {
        const storage = new MemoryStorage();
        writeProjectDraft(
            storage,
            { title: 'Draft', idea: 'A long idea', platform: 'tiktok', tone: 'viral' },
            2
        );

        const restored = readProjectDraft(storage);
        expect(restored?.step).toBe(2);
        expect(restored?.values).toMatchObject({
            title: 'Draft',
            idea: 'A long idea',
            platform: 'tiktok',
            tone: 'viral',
        });
    });

    it('ignores corrupt storage and unknown enum values', () => {
        const storage = new MemoryStorage();
        storage.setItem(PROJECT_DRAFT_KEY, '{not json');
        expect(readProjectDraft(storage)).toBeNull();

        storage.setItem(
            PROJECT_DRAFT_KEY,
            JSON.stringify({
                values: { title: 'T', platform: 'myspace', tone: 'angry' },
                step: 99,
                savedAt: 'not-a-date',
            })
        );
        const restored = readProjectDraft(storage);
        expect(restored?.step).toBe(1);
        expect(restored?.values.platform).toBeUndefined();
        expect(restored?.values.tone).toBeUndefined();
    });

    it('does not prompt for an empty draft', () => {
        const storage = new MemoryStorage();
        writeProjectDraft(storage, { title: ' ', description: '', idea: '' }, 1);
        expect(canRestoreDraft(readProjectDraft(storage))).toBe(false);
        expect(draftIsEmpty({})).toBe(true);
    });

    it('clears the draft on demand', () => {
        const storage = new MemoryStorage();
        writeProjectDraft(storage, { title: 'Draft' }, 1);
        clearProjectDraft(storage);
        expect(storage.getItem(PROJECT_DRAFT_KEY)).toBeNull();
    });
});
