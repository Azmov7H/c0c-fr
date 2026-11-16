import { useTranslations } from 'next-intl';

import { useUrlLocale } from '@/i18n/locale';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '../lib/format';
import { PLAN_IDS, planRank } from '../lib/plans';
import { buildPricingCopy } from '../lib/pricing-copy';
import type { BillingSummary, PlanId } from '../types';

interface PlanChooserProps {
    summary: BillingSummary;
    checkoutPending: boolean;
    portalPending: boolean;
    onCheckout: (plan: PlanId) => void;
    onPortal: () => void;
}

export function PlanChooser({
    summary,
    checkoutPending,
    portalPending,
    onCheckout,
    onPortal,
}: PlanChooserProps) {
    const locale = useUrlLocale();
    // AR-023: the plan's NAME, its price and its bullet list are the
    // catalogue's copy — the ids, the limits and the prices are the code's.
    const t = useTranslations('pricing');
    const copy = buildPricingCopy(t);
    const currentRank = planRank(summary.plan);
    const paidPlan = summary.plan !== 'starter';

    return (
        <section id="choose-plan" className="scroll-mt-24 space-y-4">
            <div>
                <h2 className="text-lg font-semibold">{t('chooser.title')}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    {t('chooser.description')}
                </p>
            </div>

            {paidPlan ? (
                <p className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                    {/* The date is OPTIONAL, so it travels as one value — the
                        parenthetical and everything inside it — and the
                        sentence stays one sentence in both languages. */}
                    {t('chooser.downgradeNotice', {
                        date: summary.renewalDate
                            ? ` (${formatDate(summary.renewalDate, locale)})`
                            : '',
                        plan: copy.planName(summary.plan),
                    })}
                </p>
            ) : null}

            <div className="grid gap-4 md:grid-cols-3">
                {PLAN_IDS.map((id) => {
                    const rank = planRank(id);
                    const current = id === summary.plan;
                    const direction = rank > currentRank ? 'upgrade' : 'downgrade';

                    return (
                        <div
                            key={id}
                            className="flex flex-col rounded-xl border border-border/60 p-4"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <h3 className="font-semibold">{copy.planName(id)}</h3>
                                {current ? (
                                    <Badge variant="secondary">{t('chooser.current')}</Badge>
                                ) : null}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {copy.monthlyPrice(id, locale)}
                            </p>
                            <ul className="mt-3 flex-1 space-y-1 text-xs text-muted-foreground">
                                {copy.highlights(id, locale).slice(0, 4).map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>

                            {current ? null : direction === 'upgrade' ? (
                                <Button
                                    type="button"
                                    className="mt-4 w-full gap-2"
                                    onClick={() => onCheckout(id)}
                                    disabled={checkoutPending || portalPending}
                                >
                                    <ArrowUpRight className="size-4" aria-hidden />
                                    {checkoutPending
                                        ? t('chooser.openingCheckout')
                                        : t('chooser.upgradeTo', { plan: copy.planName(id) })}
                                </Button>
                            ) : summary.managedByStripe ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="mt-4 w-full gap-2"
                                    onClick={onPortal}
                                    disabled={checkoutPending || portalPending}
                                >
                                    <ArrowDownRight className="size-4" aria-hidden />
                                    {portalPending
                                        ? t('chooser.openingPortal')
                                        : t('chooser.downgradeTo', { plan: copy.planName(id) })}
                                </Button>
                            ) : (
                                <p className="mt-4 text-xs text-muted-foreground">
                                    {t('chooser.manualPlan')}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
