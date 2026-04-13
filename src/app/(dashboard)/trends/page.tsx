import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Ideas & Trends",
  description: "Discover what's viral in your niche right now. Explore trending topics filtered by platform and category.",
}

export default function TrendsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Dynamic import to keep SSR layout fast */}
      <TrendsContent />
    </div>
  )
}

// Import at module level is fine for server components
import { TrendsContent } from "@/features/trends/components/trends-content"
