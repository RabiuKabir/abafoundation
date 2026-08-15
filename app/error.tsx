"use client";

import * as React from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Sentry is wired in Phase 5; until then at least don't swallow it.
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col justify-center bg-cream py-20">
      <Container width="narrow" className="text-center">
        <p className="font-heading text-6xl font-semibold text-navy">500</p>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          Something went wrong our end.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-ink/70">
          Not your fault. Try again — and if it keeps happening, tell us and
          we&apos;ll go and look.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Back to home
          </Link>
        </div>
        {error.digest ? (
          <p className="mt-8 text-xs text-muted-foreground">
            Reference: {error.digest}
          </p>
        ) : null}
      </Container>
    </main>
  );
}
