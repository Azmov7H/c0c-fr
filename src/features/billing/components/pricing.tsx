import { Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { AppLocale } from '@/i18n/routing';
import { getTranslations } from '@/i18n/server';
import { cn } from '@/lib/utils';
import { PLAN_CATALOGUE, PLAN_IDS } from '../lib/plans';
import { buildPricingCopy } from '../lib/pricing-copy';

interface PricingCardsProps {
    className?: string;
    currentPlan?: (typeof PLAN_IDS)[number];
    /**
     * AR-014: the pricing surface is rendered on the marketing pages, which
     * have no client runtime — so the server reads the locale and hands it
     * down, instead of a component reading it from a hook.
     */
    locale: AppLocale;
}

/**
 * AR-014: the pricing surface is rendered on the marketing pages, which are
 * SERVER components (the landing page's first-load budget has no room for a
 * client runtime) — so the locale comes from the server, not from a hook.
 *
 * AR-023: the copy comes from the catalog. The plan's NAME, its audience,
 * its badge, its price and its bullet list are all copy — the code owns the
 * ids, the limits and the prices, and `pricing-copy.ts` is the seam.
 */
export async function PricingCards({ className, currentPlan, locale }: PricingCardsProps) {
    const t = await getTranslations('pricing');
    const copy = buildPricingCopy(t);

    return (
        <div className={cn('grid grid-cols-1 gap-6 md:grid-cols-3', className)}>
            {PLAN_IDS.map((id) => {
                const plan = PLAN_CATALOGUE[id];
                const planCopy = copy.plan(id);
                const recommended = Boolean(planCopy.recommended);
                const current = currentPlan === id;

                return (
                    <article
                        key={plan.id}
                        className={cn(
                            'flex flex-col rounded-2xl border bg-card p-6',
                            recommended
                                ? 'border-primary ring-1 ring-primary'
                                : 'border-border/60'
                        )}
                    >
                        <div className="min-h-7">
                            {recommended ? (
                                <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-foreground">
                                    {planCopy.recommended}
                                </span>
                            ) : null}
                        </div>
                        <h2 className="mt-3 text-xl font-semibold">{planCopy.name}</h2>
                        <p className="mt-1 min-h-10 text-sm text-muted-foreground">
                            {planCopy.audience}
                        </p>
                        <p className="mt-4">
                            <span className="text-2xl font-bold">
                                {copy.monthlyPrice(id, locale)}
                            </span>
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {plan.monthlyPriceCents === 0
                                ? t('price.noCard')
                                : t('price.billedMonthly')}
                        </p>

                        <ul className="mt-6 flex-1 space-y-3 text-sm">
                            {copy.highlights(id, locale).map((feature) => (
                                <li key={feature} className="flex items-start gap-2">
                                    <Check
                                        className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                                        aria-hidden
                                    />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>

                        {current ? (
                            <p className="mt-6 rounded-md border border-border bg-muted/40 px-4 py-2 text-center text-sm font-medium">
                                {t('price.currentPlan')}
                            </p>
                        ) : (
                            <Button
                                className="mt-6 w-full"
                                variant={recommended ? 'default' : 'outline'}
                                asChild
                            >
                                <a href={planCtaHref(id)}>{copy.ctaLabel(id)}</a>
                            </Button>
                        )}
                    </article>
                );
            })}
        </div>
    );
}

/**
 * Where the plan card's call to action goes.
 *
 * The TARGET is code (the free plan signs up, the paid plans go to the
 * billing settings); the LABEL is copy.
 */
function planCtaHref(plan: (typeof PLAN_IDS)[number]): string {
    return plan === 'starter' ? '/signup' : `/settings/billing?plan=${plan}`;
}

export async function PlanComparisonTable({ locale }: { locale: AppLocale }) {
    const t = await getTranslations('pricing');
    const copy = buildPricingCopy(t);

    return (
        <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full min-w-[640px] border-collapse text-start text-sm">
                <caption className="sr-only">{t('compare.caption')}</caption>
                <thead>
                    <tr className="border-b border-border/60 bg-muted/40">
                        <th scope="col" className="p-4 font-semibold">
                            {t('compare.header')}
                        </th>
                        {PLAN_IDS.map((id) => (
                            <th key={id} scope="col" className="p-4 font-semibold">
                                {copy.planName(id)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {copy.comparison(locale).map((row) => (
                        <tr key={row.label} className="border-b border-border/40 last:border-0">
                            <th scope="row" className="p-4 font-medium">
                                {row.label}
                            </th>
                            {PLAN_IDS.map((id) => (
                                <td key={id} className="p-4 text-muted-foreground">
                                    {row.values[id]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export async function PricingFaq({ locale }: { locale: AppLocale }) {
    const t = await getTranslations('pricing');
    const copy = buildPricingCopy(t);

    return (
        <div className="space-y-3">
            {copy.faq(locale).map((item) => (
                <details
                    key={item.id}
                    className="rounded-xl border border-border/60 bg-card p-4"
                >
                    <summary className="cursor-pointer font-medium">{item.question}</summary>
                    <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
                </details>
            ))}
        </div>
    );
}
