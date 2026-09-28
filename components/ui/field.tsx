import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

/**
 * Label + control + hint/error, wired for screen readers. Pass the control as
 * children with the same `id`; `error` renders inline and should also be set
 * as aria-invalid on the control by the caller.
 */
function Field({
  id,
  label,
  hint,
  error,
  optional,
  className,
  children,
}: {
  id: string
  label: React.ReactNode
  hint?: React.ReactNode
  error?: string | null
  optional?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>
        {label}
        {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

/** Inline form-level feedback (errors, success confirmations). */
function FormMessage({
  tone,
  children,
  className,
}: {
  tone: "error" | "success"
  children: React.ReactNode
  className?: string
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg px-3 py-2 text-sm",
        tone === "error" ? "bg-danger-bg text-danger" : "bg-success-bg text-success",
        className
      )}
    >
      {children}
    </p>
  )
}

export { Field, FormMessage }
