import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FeatureHeaderProps {
  title: string
  description: string
  ctaLabel?: string
  ctaHref?: string
  onCtaClick?: () => void
}

export function FeatureHeader({
  title,
  description,
  ctaLabel,
  ctaHref,
  onCtaClick,
}: FeatureHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      {ctaLabel && (ctaHref ? (
        <Link href={ctaHref}>
          <Button className="h-9 px-4 rounded-xl shadow-premium hover:shadow-glow transition-all">
            <Plus className="w-4 h-4 mr-2" />
            {ctaLabel}
          </Button>
        </Link>
      ) : (
        <Button onClick={onCtaClick} className="h-9 px-4 rounded-xl shadow-premium hover:shadow-glow transition-all">
          <Plus className="w-4 h-4 mr-2" />
          {ctaLabel}
        </Button>
      ))}
    </div>
  )
}
