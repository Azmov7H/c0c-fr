import { CreateTeamDialog } from "./create-team-dialog"
import { Users } from "lucide-react"
export function TeamHeader({ newTeamName, setNewTeamName, createTeam, isCreating }: any) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          Workspace Teams
        </h1>
        <p className="text-muted-foreground">
          Manage collaborators
        </p>
      </div>

      <CreateTeamDialog
        value={newTeamName}
        onChange={setNewTeamName}
        onCreate={createTeam}
        loading={isCreating}
      />
    </div>
  )
}