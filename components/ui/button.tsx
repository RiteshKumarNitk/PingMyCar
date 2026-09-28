import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

/**
 * Button system: primary (electric blue), secondary/outline (light surface +
 * border), success, destructive, ghost, link. Consistent heights (sm 36px,
 * default 40px, lg 48px touch target) and radius; `loading` shows a spinner
 * and disables the button so a mutation can't be submitted twice.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-[10px] text-sm font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-150 outline-none select-none active:translate-y-px focus-visible:ring-[3px] focus-visible:ring-ring/35 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-card hover:bg-primary-hover",
        success: "bg-success text-white shadow-card hover:bg-success/90",
        destructive: "bg-destructive text-white shadow-card hover:bg-destructive/90 focus-visible:ring-destructive/30",
        outline: "border border-input bg-card text-foreground shadow-card hover:border-foreground/20 hover:bg-accent",
        secondary: "border border-border bg-card text-secondary-foreground hover:bg-accent",
        ghost: "text-foreground/80 hover:bg-accent hover:text-foreground",
        link: "h-auto px-0 text-primary underline-offset-4 hover:underline active:translate-y-0",
      },
      size: {
        default: "h-10 px-4 has-[>svg]:px-3.5",
        xs: "h-7 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-12 px-6 text-[0.9375rem] has-[>svg]:px-5",
        icon: "size-10",
        "icon-xs": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /** Shows a spinner and disables the button (ignored with asChild). */
    loading?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={asChild ? disabled : disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Loader2 className="animate-spin" aria-hidden />}
          {children}
        </>
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
