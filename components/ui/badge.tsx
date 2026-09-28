import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium leading-5 [&>svg]:size-3 [&>svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary-soft text-primary",
        secondary: "border-border bg-surface-2 text-muted-foreground",
        outline: "border-border text-foreground",
        success: "border-transparent bg-success-bg text-success",
        warning: "border-transparent bg-warning-bg text-warning",
        danger: "border-transparent bg-danger-bg text-danger",
        comm: "border-transparent bg-comm-bg text-comm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

/**
 * The one status vocabulary for the whole app. Color is semantic and never
 * the only signal: every status has a dot + text label.
 */
const STATUS_STYLES = {
  active: { variant: "success", label: "Active" },
  inactive: { variant: "secondary", label: "Inactive" },
  pending: { variant: "warning", label: "Pending" },
  verified: { variant: "success", label: "Verified" },
  unread: { variant: "comm", label: "Unread" },
  read: { variant: "secondary", label: "Read" },
  open: { variant: "success", label: "Open" },
  closed: { variant: "secondary", label: "Closed" },
  blocked: { variant: "danger", label: "Blocked" },
  reported: { variant: "warning", label: "Reported" },
  suspended: { variant: "danger", label: "Suspended" },
} as const satisfies Record<string, { variant: VariantProps<typeof badgeVariants>["variant"]; label: string }>

export type Status = keyof typeof STATUS_STYLES

function StatusBadge({
  status,
  label,
  className,
}: {
  status: Status
  /** Override the default label (e.g. "3 unread"). */
  label?: string
  className?: string
}) {
  const style = STATUS_STYLES[status]
  return (
    <Badge variant={style.variant} className={className}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {label ?? style.label}
    </Badge>
  )
}

export { Badge, badgeVariants, StatusBadge }
