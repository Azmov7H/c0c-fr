/**
 * T20: the landing and marketing chrome render server-side, so pulling in the
 * full `Button` (class-variance-authority + Radix Slot + tailwind-merge) for
 * three links is client runtime the visitor never uses. This keeps the exact
 * visual variants with zero client dependencies.
 *
 * The authenticated app keeps `@/components/ui/button`; only the marketing
 * surface uses this.
 */
const BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"

const VARIANTS = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  outline:
    "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
  ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
} as const

const SIZES = {
  default: "h-9 px-4 py-2",
  lg: "h-10 px-6",
} as const

export function MarketingCtaLink({
  href,
  variant = "primary",
  size = "default",
  className = "",
  children,
}: {
  href: string
  variant?: keyof typeof VARIANTS
  size?: keyof typeof SIZES
  className?: string
  children: React.ReactNode
}) {
  return (
    <a href={href} className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}>
      {children}
    </a>
  )
}
