import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Container — DESIGN_SYSTEM.md. Max-width ~1100px with comfortable gutters.
 * Every page's content sits in one of these. `width="wide"` is for admin
 * tables that need the extra room.
 */
function Container({
  className,
  width = "default",
  ...props
}: React.ComponentProps<"div"> & { width?: "default" | "narrow" | "wide" }) {
  return (
    <div
      data-slot="container"
      className={cn(
        "mx-auto w-full px-6 md:px-8",
        width === "narrow" && "max-w-[720px]",
        width === "default" && "max-w-[1100px]",
        width === "wide" && "max-w-[1400px]",
        className
      )}
      {...props}
    />
  );
}

/**
 * Section — vertical rhythm. Whitespace is the design: 56px mobile,
 * 96–128px desktop. Use this instead of ad-hoc py-* on every page.
 */
function Section({
  className,
  spacing = "default",
  ...props
}: React.ComponentProps<"section"> & { spacing?: "default" | "tight" | "loose" }) {
  return (
    <section
      data-slot="section"
      className={cn(
        spacing === "tight" && "py-10 md:py-16",
        spacing === "default" && "py-14 md:py-24",
        spacing === "loose" && "py-14 md:py-28 lg:py-32",
        className
      )}
      {...props}
    />
  );
}

export { Container, Section };
