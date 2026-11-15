import {
    ArrowLeft,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ChevronsUpDown,
    MoveLeft,
    MoveRight,
    PanelLeft,
    PanelRight,
    Redo2,
    Undo2,
} from 'lucide-react';

/**
 * AR-019 — the icon direction table (RTL-DESIGN-SYSTEM §7).
 *
 * An icon is either DIRECTIONAL (it points somewhere, so it mirrors) or
 * SEMANTIC (it names something, so it never does).
 *
 *   - directional navigation MIRRORS: `rtl:rotate-180` flips the glyph;
 *   - positional UI does not mirror the GLYPH — it mirrors through logical
 *     positioning (the same edge in both directions);
 *   - semantic and brand icons NEVER mirror: platform marks, brand logos,
 *     status glyphs, check/cross, the media transport (play/pause/rewind are
 *     a convention, not an arrow), upload/download (a convention), search.
 *
 * The table is the single place the decision is made, so the set of mirrored
 * icons in the app is countable — and the test can assert it.
 */
export const DIRECTIONAL_ICONS = {
    ArrowLeft,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ChevronsUpDown,
    MoveLeft,
    MoveRight,
    PanelLeft,
    PanelRight,
    Redo2,
    Undo2,
} as const;

export type DirectionalIconName = keyof typeof DIRECTIONAL_ICONS;

/** The icons whose GLYPH mirrors. Everything else keeps its shape. */
export const MIRRORED_ICON_NAMES: ReadonlySet<string> = new Set([
    'ArrowLeft',
    'ArrowRight',
    'ChevronLeft',
    'ChevronRight',
    'ChevronsLeft',
    'ChevronsRight',
    'MoveLeft',
    'MoveRight',
    'PanelLeft',
    'PanelRight',
    'Redo2',
    'Undo2',
]);

/**
 * The icons that must NEVER mirror, whatever the direction.
 *
 * They are listed so the rule is explicit and testable: the media transport
 * (a convention every player shares), the status and check glyphs, the
 * platform marks and the brand, and the search icon.
 */
export const NEVER_MIRRORED_ICON_NAMES: ReadonlySet<string> = new Set([
    'Check',
    'CheckCheck',
    'CircleCheck',
    'CircleCheckBig',
    'CircleX',
    'CloudUpload',
    'CloudDownload',
    'Download',
    'Facebook',
    'Instagram',
    'Linkedin',
    'Pause',
    'Play',
    'Rewind',
    'FastForward',
    'Search',
    'SkipBack',
    'SkipForward',
    'SquareCheck',
    'Twitter',
    'Upload',
    'Youtube',
    'X',
]);

/** Does this icon mirror in RTL? */
export function mirrorsInRtl(name: string): boolean {
    return MIRRORED_ICON_NAMES.has(name) && !NEVER_MIRRORED_ICON_NAMES.has(name);
}
