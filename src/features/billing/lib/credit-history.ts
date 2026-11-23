import type { CreditEvent } from '../types';

/**
 * Human rows for the ledger. The kind carries direction; `amount` is a
 * positive magnitude. Keep this list in lockstep with the backend
 * `CreditKind` vocabulary.
 *
 * AR-028 — the labels are catalog keys, not sentences: the panel translates
 * them. The ledger NOTE stays data (an operation id and a backend sentence),
 * exactly as it arrived, and is appended to the translated kind.
 */

export type CreditKindKey =
    | 'grant'
    | 'topup'
    | 'reserve'
    | 'settle'
    | 'release'
    | 'refund'
    | 'expiry';

const KIND_KEYS: Record<CreditEvent['kind'], CreditKindKey> = {
    grant: 'grant',
    topup: 'topup',
    reserve: 'reserve',
    settle: 'settle',
    release: 'release',
    refund: 'refund',
    expiry: 'expiry',
};

export function creditKindKey(kind: CreditEvent['kind']): CreditKindKey | null {
    return KIND_KEYS[kind] ?? null;
}

/**
 * A reserve is not visible spending yet; the op it was for (from the note)
 * is the only part worth surfacing. "Settled at estimate" adds nothing.
 */
export function creditHistoryNote(event: CreditEvent): string {
    const { note } = event;
    if (!note) return '';
    return note === 'Settled at estimate' ? '' : note.replace(/^estimate for /, '');
}

export function creditHistoryLabel(event: CreditEvent, base: string): string {
    const trimmed = creditHistoryNote(event);
    return trimmed ? `${base} — ${trimmed}` : base;
}
