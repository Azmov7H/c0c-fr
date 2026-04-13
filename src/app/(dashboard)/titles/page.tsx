import type { Metadata } from "next"
import { TitleGenerator } from "@/features/titles/components/title-generator"

export const metadata: Metadata = {
  title: "Title Generator",
  description: "Generate high-CTR titles optimized for YouTube, TikTok, and Instagram.",
}

export default function TitlesPage() {
  return <TitleGenerator />
}
