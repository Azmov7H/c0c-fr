import { Button } from "@/components/ui/button"
export function WorkspaceEmpty({ onGenerate, loading }: any) {
  return (
    <div className="text-center p-12 border rounded-xl">
      <h3>No script yet</h3>

      <Button onClick={onGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate Script"}
      </Button>
    </div>
  )
}