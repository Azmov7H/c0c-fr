import { describe, expect, it } from 'vitest';

import {
    DIRECTIONAL_ICONS,
    MIRRORED_ICON_NAMES,
    NEVER_MIRRORED_ICON_NAMES,
    mirrorsInRtl,
} from '../../src/components/icons/direction';

/**
 * AR-019 — the icon direction table.
 *
 * The table is the single place the decision "does this glyph flip?" is
 * made, so it can be asserted: a directional icon mirrors, a semantic one
 * never does, and the two sets never overlap.
 */
describe('the icon direction table', () => {
    it('lists the directional icons', () => {
        expect(Object.keys(DIRECTIONAL_ICONS)).toEqual(
            expect.arrayContaining(['ChevronRight', 'ChevronLeft', 'ArrowRight', 'ArrowLeft'])
        );
    });

    it('a directional icon mirrors', () => {
        expect(mirrorsInRtl('ChevronRight')).toBe(true);
        expect(mirrorsInRtl('ChevronLeft')).toBe(true);
        expect(mirrorsInRtl('ArrowRight')).toBe(true);
        expect(mirrorsInRtl('Undo2')).toBe(true);
    });

    it('a semantic icon never mirrors', () => {
        for (const name of NEVER_MIRRORED_ICON_NAMES) {
            expect(mirrorsInRtl(name), `${name} must not mirror`).toBe(false);
        }
    });

    it('the media transport, the status glyphs and the platform marks are listed', () => {
        // The media transport is a convention every player shares: a
        // right-pointing play button means "play" in every market.
        for (const name of ['Play', 'Pause', 'Rewind', 'FastForward', 'Upload', 'Download', 'Check', 'X', 'Search']) {
            expect(NEVER_MIRRORED_ICON_NAMES.has(name), `${name} must be on the never-mirrored list`).toBe(true);
        }
    });

    it('the two sets never overlap', () => {
        for (const name of MIRRORED_ICON_NAMES) {
            expect(NEVER_MIRRORED_ICON_NAMES.has(name), `${name} is in both lists`).toBe(false);
        }
    });

    it('an unknown icon does not mirror', () => {
        expect(mirrorsInRtl('SomeOtherIcon')).toBe(false);
    });
});
