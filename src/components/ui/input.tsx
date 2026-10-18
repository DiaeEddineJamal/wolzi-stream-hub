import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white shadow-inner shadow-black/30 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-white/45 placeholder:font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--wolzi-accent)/0.45)] focus-visible:border-[hsl(var(--wolzi-accent)/0.4)] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
