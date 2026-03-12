import * as React from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string
    description: string
    icon?: React.ElementType
    action?: {
        label: string
        onClick: () => void
    }
}

export function EmptyState({
    title,
    description,
    icon: Icon,
    action,
    className,
    ...props
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center animate-in fade-in-50",
                className
            )}
            {...props}
        >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6">
                {Icon ? (
                    <Icon className="h-10 w-10 text-primary" />
                ) : (
                    <div className="h-10 w-10 bg-primary/20 rounded-lg animate-pulse" />
                )}
            </div>
            <h3 className="mb-2 text-2xl font-bold tracking-tight">{title}</h3>
            <p className="mb-8 max-w-sm text-sm text-muted-foreground leading-relaxed">
                {description}
            </p>
            {action && (
                <Button onClick={action.onClick} className="h-11 px-8 shadow-sm">
                    <Plus className="mr-2 h-4 w-4" />
                    {action.label}
                </Button>
            )}
        </div>
    )
}
