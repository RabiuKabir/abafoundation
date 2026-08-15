import { redirect } from "next/navigation";

import { Container } from "@/components/ui/container";
import { getCurrentUser } from "@/lib/session";
import { ChangePasswordForm } from "./change-password-form";

export const metadata = { title: "Change password" };

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="flex min-h-screen flex-col justify-center bg-cream py-16">
      <Container width="narrow" className="max-w-[460px]">
        <h1 className="text-2xl font-semibold tracking-tight">
          {user.mustChangePassword
            ? "Choose your own password"
            : "Change your password"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {user.mustChangePassword
            ? "Your account was set up with a temporary password. Replace it before you go any further — whoever gave it to you still knows it."
            : "You'll be signed out afterwards and can sign back in with the new password."}
        </p>

        <div className="mt-8 rounded-lg border border-border bg-surface p-8 shadow-soft">
          <ChangePasswordForm />
        </div>
      </Container>
    </main>
  );
}
