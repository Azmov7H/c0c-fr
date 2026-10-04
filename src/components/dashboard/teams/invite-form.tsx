import { TeamRole } from "@/features/teams/types"
import type { Team } from "@/features/teams/types"
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
interface InviteFormProps {
  inviteEmail: string
  setInviteEmail: (email: string) => void
  inviteRole: TeamRole
  setInviteRole: (role: TeamRole) => void
  inviteMember: (args: { teamId: string; data: { email: string; role: TeamRole } }) => void
  activeTeam: Team
  isInviting: boolean
}

export function InviteForm({
  inviteEmail,
  setInviteEmail,
  inviteRole,
  inviteMember,
  activeTeam,
  isInviting
}: InviteFormProps) {

  const handleInvite = () => {
    if (!inviteEmail) return

    inviteMember({
      teamId: activeTeam.id,
      data: { email: inviteEmail, role: inviteRole }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Member</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">

        <Input
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          placeholder="email"
        />

        <Button onClick={handleInvite} disabled={isInviting}>
          Invite
        </Button>

      </CardContent>
    </Card>
  )
}