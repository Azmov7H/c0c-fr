import type { Metadata } from "next"
import { ThumbnailStudio } from "@/features/thumbnails/components/thumbnail-studio"

export const metadata: Metadata = {
  title: "Thumbnail Studio",
  description: "Create eye-catching thumbnails and cover images with AI-powered design tools.",
}

export default function ThumbnailsPage() {
  return <ThumbnailStudio />
}
