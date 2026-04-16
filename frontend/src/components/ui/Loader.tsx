import * as React from "react"
import { cn } from "../../utils/helpers"

interface LoaderProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const Loader: React.FC<LoaderProps> = ({ className, size = 'md' }) => {
  const sizes = {
    sm: "w-6 h-6 border-2",
    md: "w-10 h-10 border-3",
    lg: "w-16 h-16 border-4"
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div 
        className={cn(
          "border-purple-600 border-t-transparent rounded-full animate-spin",
          sizes[size]
        )}
      />
    </div>
  )
}

export { Loader }
