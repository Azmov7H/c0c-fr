import type { Metadata } from "next"
import { HashtagGenerator } from "@/features/hashtags/components/hashtag-generator"

export const metadata: Metadata = {
  title: "Hashtag Generator",
  description: "Generate trending hashtags optimized for maximum reach and engagement.",
}

export default function HashtagsPage() {
  return <HashtagGenerator />
}
