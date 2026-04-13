import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatCardProps {
  label: string
  value: string
  subValue?: string
  trend?: string
  trendUp?: boolean
  icon: React.ElementType
  iconColor?: string
  highlighted?: boolean
}

export function StatCard({
  label,
  value,
  subValue,
  trend,
  trendUp = true,
  icon: Icon,
  iconColor = "text-primary",
  highlighted = false,
}: StatCardProps) {
  return (
    <Card
      className={
        highlighted
          ? "relative overflow-hidden border-primary/20 bg-primary/5 shadow-glow"
          : "bg-card border-border/50 hover:border-primary/20 hover:shadow-premium transition-all duration-200 group"
      }
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5 px-5">
        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </CardTitle>
        <div
          className={`p-2 rounded-lg ${highlighted ? "bg-primary/20" : "bg-muted/60 group-hover:bg-primary/10 transition-colors"}`}
        >
          <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-3xl font-black tracking-tight">{value}</span>
          {subValue && (
            <span className="text-sm text-muted-foreground font-medium">{subValue}</span>
          )}
        </div>
        {trend && (
          <p className="text-xs font-medium text-muted-foreground mt-2 flex items-center gap-1.5">
            <span className={trendUp ? "text-emerald-500" : "text-rose-500"}>
              {trendUp ? "\u2191" : "\u2193"}
            </span>
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
