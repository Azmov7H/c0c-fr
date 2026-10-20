'use client';

import { useCallback, useSyncExternalStore } from 'react';

import { PROJECT_VIEWS, type ProjectView } from '../lib/project-filters';

const STORAGE_KEY = 'c0c:projects:view';
const listeners = new Set<() => void>();
let fallbackView: ProjectView = 'grid';

function isView(value: string | null): value is ProjectView {
    return Boolean(value && (PROJECT_VIEWS as readonly string[]).includes(value));
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    window.addEventListener('storage', listener);
    return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', listener);
    };
}

function getSnapshot(): ProjectView {
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (isView(stored)) return stored;
    } catch {
        // Storage disabled: use the in-memory choice for this visit.
    }
    return fallbackView;
}

const getServerSnapshot = (): ProjectView => 'grid';

/**
 * Grid/table is a display preference, not a filter, so it lives in localStorage
 * rather than the shareable URL. The first paint is always the grid — reading
 * storage during render would desynchronise hydration — and the stored choice
 * applies immediately after mount via the external store.
 */
export function useProjectView(): [ProjectView, (view: ProjectView) => void] {
    const view = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    const update = useCallback((next: ProjectView) => {
        fallbackView = next;
        try {
            window.localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // See getSnapshot.
        }
        for (const listener of listeners) listener();
    }, []);

    return [view, update];
}
