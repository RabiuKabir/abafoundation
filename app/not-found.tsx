import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col justify-center bg-cream py-20">
      <Container width="narrow" className="text-center">
        <p className="font-heading text-6xl font-semibold text-navy">404</p>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          That page has moved on.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-ink/70">
          The link may be old, or the story may not be published yet. Either
          way, the way back is short.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/" className={buttonVariants()}>
            Back to home
          </Link>
          <Link href="/programs" className={buttonVariants({ variant: "outline" })}>
            Browse programs
          </Link>
        </div>
      </Container>
    </main>
  );
}
