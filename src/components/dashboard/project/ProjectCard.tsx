import Link from "next/link"
import { format } from "date-fns"
import { MoreVertical } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { getPlatformIcon, getStatusStyles } from "./helpers"

export function ProjectCard({ project }: any) {
  return (
    <Link href={`/projects/${project._id}`} className="group">
      <Card
        className="
          h-full flex flex-col
          border-border/50
          transition-all duration-200
          hover:border-primary/40
          hover:shadow-premium
        "
      >
        <CardHeader className="pb-3 flex flex-row justify-between">
          <div className="space-y-1 pr-2">
            <CardTitle className="text-base leading-tight group-hover:text-primary transition-colors">
              {project.title}
            </CardTitle>

            <div className="flex items-center text-xs text-muted-foreground">
              {getPlatformIcon(project.platform)}
              <span className="ml-1.5 capitalize">
                {project.platform}
              </span>

              <span className="mx-2">•</span>

              <span>
                {format(new Date(project.updatedAt), "MMM d, yyyy")}
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex flex-col flex-1">
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
            {project.idea}
          </p>

          <div className="flex items-center justify-between mt-auto">
            <Badge className={getStatusStyles(project.status)}>
              {project.status}
            </Badge>

            <Badge variant="outline" className="capitalize">
              {project.tone}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}