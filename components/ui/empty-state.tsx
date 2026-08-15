import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * EmptyState — DESIGN_SYSTEM.md. Friendly message for empty tables and lists.
 * Real states read as hand-made: never ship a blank table.
 */
function EmptyState({
  className,
  icon,
  title,
  description,
  action,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card/60 px-6 py-16 text-center",
        className
      )}
      {...props}
    >
      {icon ? (
        <div className="flex size-12 items-center justify-center rounded-pill bg-mist text-teal [&_svg]:size-5">
          {icon}
        </div>
      ) : null}
      <h3 className="font-heading text-lg font-semibold text-navy">{title}</h3>
      {description ? (
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export { EmptyState };
