import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Badge — DESIGN_SYSTEM.md status pills (999px radius).
 * Map statuses onto these intents, e.g. draft → neutral, in_review → warning,
 * published/confirmed → success, rejected/archived → danger, pending → info.
 * Terracotta is never used here — it belongs to Donate only.
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 rounded-pill border px-2.5 py-1 text-xs leading-none font-medium whitespace-nowrap transition-colors [&>svg]:size-3",
  {
    variants: {
      variant: {
        // Muted text on the sand tint measures 4.39:1 at 12px — just under
        // AA. The badge's own fill is darker than any page background, so it
        // needs the full-strength ink rather than the secondary text colour.
        neutral: "border-border bg-secondary text-ink",
        info: "border-teal/20 bg-mist text-teal",
        success: "border-success/20 bg-success/10 text-success",
        warning: "border-warning/20 bg-warning/10 text-warning",
        danger: "border-danger/20 bg-danger/10 text-danger",
        solid: "border-transparent bg-navy text-primary-foreground",
        outline: "border-border bg-transparent text-foreground",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

function Badge({
  className,
  variant,
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      { className: cn(badgeVariants({ variant }), className) },
      props
    ),
    render,
    state: { slot: "badge", variant },
  });
}

export { Badge, badgeVariants };
