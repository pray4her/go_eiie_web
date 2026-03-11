import * as React from "react"
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-muted animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

type TableSkeletonProps = {
  rows?: number
  columns?: number
}

function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="w-full overflow-hidden rounded-lg border">
      <div className="flex border-b p-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="mx-2 h-4 w-24" />
        ))}
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center p-3">
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton key={c} className="mx-2 h-4 w-32" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export { Skeleton, TableSkeleton as SkeletonTable }


