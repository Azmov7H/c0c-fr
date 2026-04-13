import { Card,CardContent,CardTitle, CardHeader } from "@/components/ui/card"
import { UserMinus } from "lucide-react"
import { Button } from "@/components/ui/button"
export function TeamMembers({ activeTeam, removeMember }: any) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Members</CardTitle>
      </CardHeader>

      <CardContent className="divide-y">
        {activeTeam.members.map((m: any) => (
          <div key={m.user.id} className="flex justify-between p-4">

            <div>
              <p>{m.user.firstName} {m.user.lastName}</p>
              <p className="text-xs text-muted-foreground">
                {m.user.email}
              </p>
            </div>

            <Button
              size="icon"
              variant="ghost"
              onClick={() =>
                removeMember({
                  teamId: activeTeam.id,
                  userId: m.user.id
                })
              }
            >
              <UserMinus className="w-4 h-4" />
            </Button>

          </div>
        ))}
      </CardContent>
    </Card>
  )
}