import Link from "next/link";

import { Container } from "@/components/ui/container";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  return (
    <main className="flex min-h-screen flex-col justify-center bg-cream py-16">
      <Container width="narrow" className="max-w-[420px]">
        <div className="text-center">
          <Link
            href="/"
            className="font-heading text-xl font-semibold tracking-tight text-navy"
          >
            ABA{" "}
            <span className="text-sm font-normal tracking-[0.18em] text-muted-foreground uppercase">
              Admin
            </span>
          </Link>
          <h1 className="mt-8 text-2xl font-semibold tracking-tight">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            For foundation staff. Ask an Admin if you need an account.
          </p>
        </div>

        <div className="mt-8 rounded-lg border border-border bg-surface p-8 shadow-soft">
          <LoginForm next={safeNext} />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Forgotten your password? An Admin can set a new one for you — there is
          no self-service reset yet.
        </p>
      </Container>
    </main>
  );
}
