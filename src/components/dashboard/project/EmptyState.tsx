import Link from "next/link"
import { FolderOpen, Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center py-16 text-center">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <FolderOpen className="h-6 w-6 text-primary" />
        </div>

        <h3 className="text-lg font-semibold mb-2">
          No projects yet
        </h3>

        <p className="text-muted-foreground max-w-sm mb-6">
          Create your first project to start generating content.
        </p>

        <Link href="/projects/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}