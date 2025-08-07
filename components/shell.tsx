import type React from "react"
import { cn } from "@/lib/utils"

interface ShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function Shell({ children, className, ...props }: ShellProps) {
  return (
    <div className={cn("container mx-auto px-4 py-6", className)} {...props}>
      {children}
    </div>
  )
}
