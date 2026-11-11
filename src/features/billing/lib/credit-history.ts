import type { CreditEvent } from '../types';

/**
 * Human rows for the ledger. The kind carries direction; `amount` is a
 * positive magnitude. Keep this list in lockstep with the backend
 * `CreditKind` vocabulary.
 */
const KIND_LABELS: Record<CreditEvent['kind'], string> = {
    grant: 'Monthly credit grant',
    topup: 'Top-up pack',
    reserve: 'Reserved for a generation',
    settle: 'Generation charged',
    release: 'Reservation returned',
    refund: 'Refund',
    expiry: 'Unused credits expired',
};

/**
 * A reserve is not visible spending yet; the op it was for (from the note)
 * is the only part worth surfacing. "Settled at estimate" adds nothing.
 */
export function creditHistoryLabel(event: CreditEvent): string {
    const base = KIND_LABELS[event.kind] ?? event.kind;
    const { note } = event;
    if (!note) return base;
    // Ledger notes carry the operation: "estimate for scripts.generate",
    // "Settled at estimate", "Operation failed or was cancelled".
    const trimmed =
        note === 'Settled at estimate' ? '' : note.replace(/^estimate for /, '');
    return trimmed ? `${base} — ${trimmed}` : base;
}
