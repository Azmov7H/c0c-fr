"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"

type Props = {
  value: string
  onChange: (val: string) => void
  onCreate: (data: { name: string }) => void
  loading: boolean
}

export function CreateTeamDialog({
  value,
  onChange,
  onCreate,
  loading,
}: Props) {

  const handleSubmit = () => {
    if (!value.trim()) return
    onCreate({ name: value })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Workspace
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
          <DialogDescription>
            Create a new team workspace to manage projects.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <Label>Workspace Name</Label>
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Marketing Team"
          />
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={loading || !value.trim()}
          >
            {loading ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}