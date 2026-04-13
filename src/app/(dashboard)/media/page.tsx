import type { Metadata } from "next"
import { MediaLibrary } from "@/features/media/components/media-library"

export const metadata: Metadata = {
  title: "Media Library",
  description: "Browse and manage your uploaded media assets, images, and video clips.",
}

export default function MediaPage() {
  return <MediaLibrary />
}
