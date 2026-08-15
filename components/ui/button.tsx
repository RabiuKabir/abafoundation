import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Button — DESIGN_SYSTEM.md
 * Variants: primary (navy) · donate (terracotta) · outline · ghost.
 * `donate` is the ONLY place terracotta may be used. Do not add accents.
 */
const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 items-center justify-center gap-2",
    "rounded-button border border-transparent bg-clip-padding",
    "font-medium whitespace-nowrap select-none",
    "transition-[transform,box-shadow,background-color,border-color,color]",
    "hover:-translate-y-px active:translate-y-0",
    "outline-none focus-visible:ring-3 focus-visible:ring-ring/45 focus-visible:border-ring",
    "disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0",
    "motion-reduce:hover:translate-y-0",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-soft hover:bg-[color-mix(in_oklab,var(--navy),white_10%)] hover:shadow-lift",
        donate:
          "bg-terracotta text-white shadow-soft hover:bg-[color-mix(in_oklab,var(--terracotta),black_8%)] hover:shadow-lift",
        outline:
          "border-border bg-surface text-navy shadow-soft hover:border-teal hover:text-teal hover:shadow-lift",
        ghost: "text-navy hover:bg-secondary hover:text-navy",
        link: "text-teal underline-offset-4 hover:underline hover:translate-y-0",
        destructive:
          "bg-danger text-white shadow-soft hover:bg-[color-mix(in_oklab,var(--danger),black_8%)]",
      },
      size: {
        sm: "h-9 px-4 text-[0.8125rem]",
        default: "h-11 px-5 text-sm",
        lg: "h-12 px-7 text-base",
        icon: "size-11",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
