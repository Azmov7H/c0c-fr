import type { Metadata } from "next"
import { AudioStudio } from "@/features/audio/components/audio-studio"

export const metadata: Metadata = {
  title: "Audio Effects",
  description: "Generate and browse AI-powered audio effects, background music, and soundscapes.",
}

export default function AudioPage() {
  return <AudioStudio />
}
