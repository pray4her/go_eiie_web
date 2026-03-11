import * as React from "react"

import { cn } from "@/lib/utils"

function PageHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-header"
      className={cn("flex flex-col gap-2 py-6", className)}
      {...props}
    />
  )
}

function PageTitle({ className, ...props }: React.ComponentProps<"h1">) {
  return (
    <h1
      data-slot="page-title"
      className={cn("text-3xl font-semibold tracking-tight", className)}
      {...props}
    />
  )
}

function PageDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="page-description"
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  )
}

function PageActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-actions"
      className={cn("ml-auto flex items-center gap-2", className)}
      {...props}
    />
  )
}

export { PageHeader, PageTitle, PageDescription, PageActions }


