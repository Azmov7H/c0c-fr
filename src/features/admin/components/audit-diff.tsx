import { useTranslations } from 'next-intl';

export interface AuditDiffEntry {
    label: string;
    before: string;
    after: string;
}

/**
 * Before/after side-by-side diff (spec §7.2, `AuditDiff`) — used on mutation
 * detail pages to show what the audit row recorded.
 */
export function AuditDiff({ entries }: { entries: AuditDiffEntry[] }) {
    const t = useTranslations('admin');
    if (entries.length === 0) return null;
    return (
        <table className="w-full text-sm">
            <thead>
                <tr>
                    <th className="py-1 text-start font-medium text-muted-foreground">
                        {t('components.auditDiff.field')}
                    </th>
                    <th className="py-1 text-start font-medium text-muted-foreground">
                        {t('components.auditDiff.before')}
                    </th>
                    <th className="py-1 text-start font-medium text-muted-foreground">
                        {t('components.auditDiff.after')}
                    </th>
                </tr>
            </thead>
            <tbody>
                {entries.map((entry, index) => (
                    <tr key={entry.label || index} className="border-t border-border/50">
                        <td className="py-1 font-medium">{entry.label}</td>
                        <td className="py-1 text-muted-foreground">{entry.before}</td>
                        <td className="py-1">{entry.after}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
