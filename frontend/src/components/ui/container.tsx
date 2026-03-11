import * as React from "react"

import { cn } from "@/lib/utils"

function Container({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="container"
      className={cn("mx-auto w-full max-w-6xl px-4 md:px-6", className)}
      {...props}
    />
  )
}

export { Container }


