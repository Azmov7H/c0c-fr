"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  indicatorClassName,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & { indicatorClassName?: string }) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      // AR-021: the value belongs to the ROOT as well. It used to be
      // destructured out and only used for the fill, so the progressbar
      // carried no `aria-valuenow` and announced itself as INDETERMINATE —
      // a screen reader was told the bar had no value at all.
      value={value}
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        // AR-021: the fill is a WIDTH, not a transform.
        //
        // `translateX(-38%)` shifts the indicator to the left, so the bar
        // fills from the LEFT edge — in English. The bar does not know about
        // the direction: in an RTL document the same shift fills from the
        // END edge, and the progress bar runs the wrong way.
        //
        // A block-level box with a specified width is placed at the INLINE
        // START edge of its containing block — the right in Arabic, the left
        // in English — so the same style fills from the start in BOTH
        // directions, with no direction-specific code at all.
        className={cn("bg-primary h-full transition-all", indicatorClassName)}
        style={{ width: `${value || 0}%` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
