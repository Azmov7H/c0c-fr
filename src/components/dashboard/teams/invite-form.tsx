import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
export function InviteForm({
  inviteEmail,
  setInviteEmail,
  inviteRole,
  setInviteRole,
  inviteMember,
  activeTeam,
  isInviting
}: any) {

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