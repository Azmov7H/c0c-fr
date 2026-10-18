import type { Metadata } from "next"
import { PageHeader } from "@/components/shared/page-header"
import { SeoView } from "@/features/seo/components/seo-view"

export const metadata: Metadata = {
  title: "SEO Analyzer",
  description: "SEO scores, keywords and hashtags for your projects.",
}

export default function SeoPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="SEO Analyzer"
        description="Score your project's titles, descriptions and hashtags, and generate improvements."
      />
      <SeoView />
    </div>
  )
}
