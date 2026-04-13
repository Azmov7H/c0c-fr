import { Card,CardHeader,CardContent,CardTitle } from "@/components/ui/card"
export function TeamSwitcher({ teams, activeTeam, setSelectedTeamId }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Workspaces</CardTitle>
      </CardHeader>

      <CardContent className="space-y-2">
        {teams.map((t: any) => (
          <div
            key={t.id ?? t.name}
            onClick={() => setSelectedTeamId(t.id)}
            className={`
              p-3 rounded-lg cursor-pointer
              transition
              ${activeTeam.id === t.id
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted"
              }
            `}
          >
            {t.name}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}