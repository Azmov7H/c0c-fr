import { create } from 'zustand';

/**
 * T16 — dynamic breadcrumb title.
 *
 * T10's breadcrumbs are derived statically from the pathname, so a project id
 * renders as the raw id. The workspace registers its loaded title here; the
 * header substitutes it only for the matching segment.
 */
interface BreadcrumbState {
    projectId: string | null;
    projectTitle: string | null;
    setProject: (projectId: string, title: string) => void;
    clearProject: (projectId: string) => void;
}

export const useBreadcrumbStore = create<BreadcrumbState>()((set) => ({
    projectId: null,
    projectTitle: null,
    setProject: (projectId, projectTitle) => set({ projectId, projectTitle }),
    clearProject: (projectId) =>
        set((state) => (state.projectId === projectId ? { projectId: null, projectTitle: null } : state)),
}));
