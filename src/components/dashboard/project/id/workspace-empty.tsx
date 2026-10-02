import { Button } from "@/components/ui/button"
interface WorkspaceEmptyProps {
  onGenerate: () => void
  loading: boolean
}

export function WorkspaceEmpty({ onGenerate, loading }: WorkspaceEmptyProps) {
  return (
    <div className="text-center p-12 border rounded-xl">
      <h3>No script yet</h3>

      <Button onClick={onGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate Script"}
      </Button>
    </div>
  )
}