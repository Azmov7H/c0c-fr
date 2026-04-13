import { useCreateTeam, useInviteMember, useRemoveMember, useTeams } from "@/features/teams/hooks/use-teams"
import { useMemo,useState } from "react"
export type TeamRole = "owner" | "admin" | "editor" | "viewer"
export function useTeamManagement() {
  const { data: teams, isLoading } = useTeams()
  const { mutate: createTeam, isPending: isCreating } = useCreateTeam()
  const { mutate: inviteMember, isPending: isInviting } = useInviteMember()
  const { mutate: removeMember } = useRemoveMember()

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<TeamRole>("editor")
  const [newTeamName, setNewTeamName] = useState("")

  const activeTeam = useMemo(() => {
    if (!teams?.length) return null
    return selectedTeamId
      ? teams.find(t => t.id === selectedTeamId)
      : teams[0]
  }, [teams, selectedTeamId])

  return {
    teams,
    isLoading,
    activeTeam,
    setSelectedTeamId,

    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,

    newTeamName,
    setNewTeamName,

    createTeam,
    inviteMember,
    removeMember,

    isCreating,
    isInviting
  }
}