import * as React from "react"
import { cn } from "@/lib/utils"
import { type LucideIcon } from "lucide-react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Optional icon to display on the left side of the input
   */
  icon?: LucideIcon
  /**
   * Error message to display below the input
   */
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", icon: Icon, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative">
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors",
              "placeholder:text-muted",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
              Icon && "pl-10",
              error && "border-error focus:ring-error",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-error">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
