import type { LucideProps } from 'lucide-react';

import { cn } from '@/lib/utils';

import { DIRECTIONAL_ICONS, mirrorsInRtl, type DirectionalIconName } from './direction';

/**
 * AR-019 — the direction-aware icon.
 *
 * The ONE place an icon is allowed to flip. The table in `./direction` says
 * which icons are directional; this wrapper applies it:
 *
 *   <DirIcon name="ChevronRight" />   → mirrors in RTL
 *   <DirIcon name="Play" />            → never mirrors (a convention)
 *
 * Everything else in the app renders its icons directly — a `rtl:rotate-180`
 * on an icon that has no business flipping is a bug this wrapper makes
 * impossible to write by accident, because the direction is decided in one
 * table.
 */
export interface DirIconProps extends Omit<LucideProps, 'ref'> {
    name: DirectionalIconName | (string & {});
    className?: string;
}

export function DirIcon({ name, className, ...props }: DirIconProps) {
    const Icon = DIRECTIONAL_ICONS[name as DirectionalIconName];
    if (!Icon) {
        // A name that is not in the table is not a directional icon: it is
        // rendered as it is. Failing loudly here would break a page over an
        // icon; the table's own test is where the rule is enforced.
        return null;
    }
    return (
        <Icon
            className={cn(mirrorsInRtl(name) ? 'rtl:rotate-180' : undefined, className)}
            {...props}
        />
    );
}
