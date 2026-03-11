import * as React from "react"
import { cn } from "@/lib/utils"

type EmptyStateProps = React.ComponentProps<"div"> & {
  title: string
  description?: string
  action?: React.ReactNode
  icon?: React.ReactNode
}

function EmptyState({ className, title, description, action, icon, ...props }: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn("flex w-full flex-col items-center justify-center gap-3 rounded-lg border p-10 text-center", className)}
      {...props}
    >
      {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      <div className="text-lg font-medium">{title}</div>
      {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  )
}

export { EmptyState }


