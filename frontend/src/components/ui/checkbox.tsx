"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CheckboxProps {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, disabled, id, ...props }, ref) => {
    return (
      <div className="relative inline-flex items-center">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          checked={checked || false}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          disabled={disabled}
          className="sr-only"
          {...props}
        />
        <div
          className={cn(
            "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
            checked ? "bg-primary text-primary-foreground" : "bg-background",
            className
          )}
          onClick={() => !disabled && onCheckedChange?.(!checked)}
        >
          {checked && (
            <Check className="h-4 w-4 text-current" />
          )}
        </div>
      </div>
    )
  }
)

Checkbox.displayName = "Checkbox"

export { Checkbox }
