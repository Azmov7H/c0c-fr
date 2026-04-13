import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface TwoPanelLayoutProps {
  // Left panel (settings/form)
  leftTitle: string
  leftDescription?: string
  leftIcon?: React.ElementType
  leftContent: React.ReactNode

  // Right panel (preview/output)
  rightTitle: string
  rightDescription?: string
  rightContent: React.ReactNode

  // Layout ratio
  leftSpan?: 1 | 2
  rightSpan?: 2 | 1

  // Optional actions
  rightAction?: React.ReactNode
}

export function TwoPanelLayout({
  leftTitle,
  leftDescription,
  leftIcon: LeftIcon,
  leftContent,
  rightTitle,
  rightDescription,
  rightContent,
  leftSpan = 1,
  rightSpan = 2,
  rightAction,
}: TwoPanelLayoutProps) {
  const leftColClass = leftSpan === 1 ? "lg:col-span-1" : "lg:col-span-2"
  const rightColClass = rightSpan === 2 ? "lg:col-span-2" : "lg:col-span-1"

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Left Panel */}
      <Card className={`${leftColClass} glass border-border/50 rounded-[32px] shadow-premium h-full flex flex-col overflow-hidden`}>
        <CardHeader className="bg-muted/30 pb-6 border-b border-border/50">
          <CardTitle className="flex items-center gap-3 text-xl font-bold">
            {LeftIcon && (
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <LeftIcon className="w-5 h-5" />
              </div>
            )}
            {leftTitle}
          </CardTitle>
          {leftDescription && (
            <CardDescription className="font-medium">{leftDescription}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex-1 p-6 space-y-6 overflow-y-auto">
          {leftContent}
        </CardContent>
      </Card>

      {/* Right Panel */}
      <Card className={`${rightColClass} glass border-border/50 rounded-[32px] shadow-premium h-full flex flex-col overflow-hidden`}>
        <CardHeader className="flex flex-row items-center justify-between bg-muted/30 pb-6 border-b border-border/50 px-6">
          <div>
            <CardTitle className="text-xl font-bold">{rightTitle}</CardTitle>
            {rightDescription && (
              <CardDescription className="font-medium">{rightDescription}</CardDescription>
            )}
          </div>
          {rightAction && <div>{rightAction}</div>}
        </CardHeader>
        <CardContent className="flex-1 p-6 flex flex-col justify-start min-h-[500px]">
          {rightContent}
        </CardContent>
      </Card>
    </div>
  )
}
