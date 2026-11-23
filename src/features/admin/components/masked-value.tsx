import { useTranslations } from 'next-intl';

/**
 * Mask/reveal by permission (spec §7.2, `MaskedValue`).
 *
 * The parent (user/detail surfaces) passes `revealed` — the mask itself is
 * presentation; the authority is the caller's permission check.
 */
export function MaskedValue({
    value,
    revealed = false,
    mask = '•••',
}: {
    value: string;
    /** When false the value is masked regardless of content. */
    revealed?: boolean;
    mask?: string;
}) {
    const t = useTranslations('admin');
    if (!revealed) {
        return (
            <span className="font-mono text-xs text-muted-foreground" title={t('components.maskedValue.hidden')}>
                {mask}
            </span>
        );
    }
    return <span className="font-mono text-xs break-all">{value}</span>;
}
