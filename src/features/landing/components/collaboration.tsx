import { ShieldCheck, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

const ROLES = ['Owner', 'Admin', 'Editor', 'Viewer'] as const;

/**
 * The differentiator teams care about. Roles are the real ones the product
 * enforces (TeamRole enum: owner/admin/editor/viewer) — not invented tiers.
 */
export function Collaboration() {
    return (
        <section className="py-16 md:py-24">
            <div className="container mx-auto max-w-6xl px-4">
                <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
                    <div>
                        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-foreground">
                            <Users className="h-3.5 w-3.5" aria-hidden />
                            Built for teams
                        </span>
                        <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                            One project, every asset, the whole team
                        </h2>
                        <p className="mt-4 leading-relaxed text-muted-foreground">
                            Invite your editor to the script and your designer to the
                            thumbnails — everyone works from the same project, so the
                            version you reviewed is the version that ships.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-2">
                            {ROLES.map((role) => (
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
                                <p className="text-sm font-semibold">Roles you already understand</p>
                                <p className="text-xs text-muted-foreground">
                                    Owner and admin can manage members; editors work on assets;
                                    viewers see the result.
                                </p>
                            </div>
                        </div>
                        <ul className="mt-4 space-y-3 text-sm">
                            <li className="flex items-center justify-between">
                                <span className="text-muted-foreground">Script — “Week 2 Retention”</span>
                                <span className="text-xs font-medium text-primary">Editing: Mina (editor)</span>
                            </li>
                            <li className="flex items-center justify-between">
                                <span className="text-muted-foreground">Thumbnail — v3</span>
                                <span className="text-xs font-medium text-primary">Reviewing: Leo (admin)</span>
                            </li>
                            <li className="flex items-center justify-between">
                                <span className="text-muted-foreground">Sound bed — “tense build”</span>
                                <span className="text-xs font-medium text-muted-foreground">Ready</span>
                            </li>
                        </ul>
                        <p className="mt-4 text-[11px] text-muted-foreground">
                            Example project view — sample names.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
