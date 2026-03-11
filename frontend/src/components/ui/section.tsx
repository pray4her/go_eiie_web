import * as React from "react"

import { cn } from "@/lib/utils"

function Section({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="section"
      className={cn("space-y-4", className)}
      {...props}
    />
  )
}

function SectionHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="section-header"
      className={cn("flex items-end justify-between gap-2", className)}
      {...props}
    />
  )
}

function SectionTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="section-title"
      className={cn("text-xl font-semibold", className)}
      {...props}
    />
  )
}

function SectionDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="section-description"
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  )
}

function SectionContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="section-content"
      className={cn("", className)}
      {...props}
    />
  )
}

export { Section, SectionHeader, SectionTitle, SectionDescription, SectionContent }


