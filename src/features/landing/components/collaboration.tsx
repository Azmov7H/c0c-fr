import { ShieldCheck, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { getTranslations } from '@/i18n/server';

interface ActivityCopy {
    asset: string;
    status: string;
}

/**
 * The differentiator teams care about. Roles are the real ones the product
 * enforces (TeamRole enum: owner/admin/editor/viewer) — not invented tiers.
 */
export async function Collaboration() {
    const t = await getTranslations('landing');
    const roles = t.raw('collaboration.roles') as string[];
    const activity = t.raw('collaboration.activity') as ActivityCopy[];

    return (
        <section className="py-16 md:py-24">
            <div className="container mx-auto max-w-6xl px-4">
                <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
                    <div>
                        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-foreground">
                            <Users className="h-3.5 w-3.5" aria-hidden />
                            {t('collaboration.badge')}
                        </span>
                        <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                            {t('collaboration.title')}
                        </h2>
                        <p className="mt-4 leading-relaxed text-muted-foreground">
                            {t('collaboration.description')}
                        </p>
                        <div className="mt-6 flex flex-wrap gap-2">
                            {roles.map((role) => (
                                <Badge key={role} variant="secondary" className="rounded-full px-3">
                                    {role}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
                        <div className="flex items-center gap-3 border-b border-border/60 pb-4">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <ShieldCheck className="h-5 w-5" aria-hidden />
                            </span>
                            <div>
                                <p className="text-sm font-semibold">{t('collaboration.rolesTitle')}</p>
                                <p className="text-xs text-muted-foreground">
                                    {t('collaboration.rolesDescription')}
                                </p>
                            </div>
                        </div>
                        <ul className="mt-4 space-y-3 text-sm">
                            {activity.map((entry, index) => (
                                <li key={entry.asset} className="flex items-center justify-between">
                                    <span className="text-muted-foreground">{entry.asset}</span>
                                    {/* The last sample row is a FINISHED item and
                                        is styled neutral, while the two active
                                        rows carry the accent — a presentation
                                        decision, so it stays in the code. */}
                                    <span
                                        className={
                                            index === activity.length - 1
                                                ? 'text-xs font-medium text-muted-foreground'
                                                : 'text-xs font-medium text-primary'
                                        }
                                    >
                                        {entry.status}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-4 text-[11px] text-muted-foreground">
                            {t('collaboration.exampleNote')}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
