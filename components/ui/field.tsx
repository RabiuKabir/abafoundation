import * as React from "react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

/**
 * Field — the labelled wrapper for Input / Textarea / Select.
 * DESIGN_SYSTEM.md: inputs are always labelled, with inline error text.
 * Wire the control with the ids this gives you:
 *
 *   <Field htmlFor="email" label="Email" error={errors.email}>
 *     <Input id="email" aria-describedby="email-error" />
 *   </Field>
 */
function Field({
  className,
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div data-slot="field" className={cn("grid gap-2", className)} {...props}>
      <Label htmlFor={htmlFor} className="text-navy">
        {label}
        {required ? (
          <span className="text-danger" aria-hidden="true">
            *
          </span>
        ) : null}
      </Label>
      {children}
      {hint && !error ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export { Field };
