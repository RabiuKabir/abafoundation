"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PASSWORD_MIN } from "@/lib/validation";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor";
  active: boolean;
  mustChangePassword: boolean;
};

export function UsersClient({
  initialUsers,
  currentUserId,
}: {
  initialUsers: UserRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  async function createUser(formData: FormData) {
    setBusy("create");
    setErrors({});
    setFormError(null);
    setNotice(null);

    const body = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      role: String(formData.get("role") ?? "editor"),
      password: String(formData.get("password") ?? ""),
    };

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);

    if (!res.ok) {
      if (data.fields) setErrors(data.fields);
      setFormError(data.error ?? "Could not create that user.");
      return;
    }

    setOpen(false);
    setNotice(
      `${body.email} created. Give them the password in person — they must change it at first sign-in.`
    );
    router.refresh();
  }

  async function setActive(id: string, active: boolean) {
    setBusy(id);
    setFormError(null);
    setNotice(null);
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setFormError(data.error ?? "Could not update that user.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-8 grid gap-6">
      {notice ? (
        <p className="rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
          {notice}
        </p>
      ) : null}
      {formError ? (
        <p
          role="alert"
          className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {formError}
        </p>
      ) : null}

      {open ? (
        <Card>
          <CardContent>
            <CardTitle className="text-lg">Add a user</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              You set the first password and pass it on yourself — there is no
              invite email yet. They&apos;ll be asked to change it immediately.
            </p>
            <form
              action={createUser}
              className="mt-6 grid gap-5 sm:grid-cols-2"
            >
              <Field label="Name" htmlFor="name" required error={errors.name}>
                <Input id="name" name="name" required autoFocus />
              </Field>
              <Field
                label="Email"
                htmlFor="email"
                required
                error={errors.email}
              >
                <Input id="email" name="email" type="email" required />
              </Field>
              <Field label="Role" htmlFor="role" required error={errors.role}>
                <Select name="role" defaultValue="editor">
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">
                      Editor — own drafts only
                    </SelectItem>
                    <SelectItem value="admin">Admin — full access</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field
                label="Temporary password"
                htmlFor="password"
                required
                hint={`At least ${PASSWORD_MIN} characters.`}
                error={errors.password}
              >
                <Input id="password" name="password" type="text" required />
              </Field>
              <div className="flex gap-3 sm:col-span-2">
                <Button type="submit" disabled={busy === "create"}>
                  {busy === "create" ? "Creating…" : "Create user"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div>
          <Button onClick={() => setOpen(true)}>+ Add user</Button>
        </div>
      )}

      <Card className="overflow-x-auto">
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 font-medium text-muted-foreground">Name</th>
                <th className="pb-3 font-medium text-muted-foreground">Role</th>
                <th className="pb-3 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="pb-3" />
              </tr>
            </thead>
            <tbody>
              {initialUsers.map((u) => (
                <tr key={u.id} className="border-b border-border/60 last:border-0">
                  <td className="py-4">
                    <div className="font-medium text-navy">{u.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {u.email}
                    </div>
                  </td>
                  <td className="py-4">
                    <Badge variant={u.role === "admin" ? "info" : "neutral"}>
                      {u.role}
                    </Badge>
                  </td>
                  <td className="py-4">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant={u.active ? "success" : "danger"}>
                        {u.active ? "active" : "deactivated"}
                      </Badge>
                      {u.mustChangePassword ? (
                        <Badge variant="warning">temp password</Badge>
                      ) : null}
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    {u.id === currentUserId ? (
                      <span className="text-xs text-muted-foreground">you</span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy === u.id}
                        onClick={() => setActive(u.id, !u.active)}
                      >
                        {busy === u.id
                          ? "…"
                          : u.active
                            ? "Deactivate"
                            : "Reactivate"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
