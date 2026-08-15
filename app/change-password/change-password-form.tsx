"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PASSWORD_MIN } from "@/lib/validation";
import {
  changePasswordAction,
  type ChangePasswordState,
} from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="mt-2 w-full" disabled={pending}>
      {pending ? "Saving…" : "Set new password"}
    </Button>
  );
}

export function ChangePasswordForm() {
  const [state, action] = useActionState<ChangePasswordState, FormData>(
    changePasswordAction,
    {}
  );

  return (
    <form action={action} className="grid gap-5">
      {state.error ? (
        <p
          role="alert"
          className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {state.error}
        </p>
      ) : null}

      <Field
        label="Current password"
        htmlFor="currentPassword"
        error={state.errors?.currentPassword}
      >
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          aria-invalid={Boolean(state.errors?.currentPassword)}
        />
      </Field>

      <Field
        label="New password"
        htmlFor="newPassword"
        hint={`At least ${PASSWORD_MIN} characters. Length beats symbols.`}
        error={state.errors?.newPassword}
      >
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={Boolean(state.errors?.newPassword)}
        />
      </Field>

      <Field
        label="Confirm new password"
        htmlFor="confirmPassword"
        error={state.errors?.confirmPassword}
      >
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={Boolean(state.errors?.confirmPassword)}
        />
      </Field>

      <SubmitButton />
    </form>
  );
}
