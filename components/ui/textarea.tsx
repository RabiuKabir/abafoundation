import * as React from "react";

import { cn } from "@/lib/utils";

/** Textarea — DESIGN_SYSTEM.md. Pair with <Field> for label + inline error. */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-28 w-full rounded-lg border border-input bg-surface px-3.5 py-2.5 text-base leading-relaxed transition-colors outline-none md:text-sm",
        "placeholder:text-muted-foreground",
        "hover:border-teal/50",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40",
        "disabled:cursor-not-allowed disabled:bg-secondary disabled:opacity-60",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
