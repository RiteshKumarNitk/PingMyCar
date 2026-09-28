import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-[10px] border border-input bg-card px-3.5 py-2.5 text-base leading-relaxed shadow-card transition-[border-color,box-shadow] outline-none placeholder:text-muted-foreground/80 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-70 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 focus-visible:outline-none",
        "aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/15",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
