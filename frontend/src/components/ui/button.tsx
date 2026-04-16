import * as React from "react"
import { cn } from "../../utils/helpers"

const Button = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button"> & { variant?: 'primary' | 'secondary' | 'ghost' }>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variants = {
      primary: "bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 shadow-lg shadow-primary/20",
      secondary: "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/10 backdrop-blur-md",
      ghost: "bg-transparent text-text-muted hover:text-primary hover:bg-primary/5"
    }
    
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          variants[variant],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
