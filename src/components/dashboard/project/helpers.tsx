import {
  Youtube,
  Instagram,
  PlaySquare,
  FileText,
} from "lucide-react"

export const getPlatformIcon = (platform: string) => {
  const base = "w-4 h-4"

  switch (platform) {
    case "youtube":
      return <Youtube className={`${base} text-destructive`} />
    case "instagram":
      return <Instagram className={`${base} text-primary`} />
    case "tiktok":
      return <PlaySquare className={`${base} text-accent`} />
    default:
      return <FileText className={base} />
  }
}

export const getStatusStyles = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-accent/10 text-accent"
    case "processing":
      return "bg-primary/10 text-primary"
    case "archived":
      return "bg-muted text-muted-foreground"
    default:
      return "bg-yellow-500/10 text-yellow-500"
  }
}