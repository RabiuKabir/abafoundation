import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/container";

export const metadata = { title: "Thank you" };

/**
 * Deliberately says "pending", not "paid" or "received". The status on this
 * page must never claim more than the server actually knows — nobody has
 * looked at the bank statement yet.
 */
export default async function ThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  return (
    <Section spacing="loose">
      <Container width="narrow" className="text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-pill bg-mist text-2xl text-teal">
          ✓
        </div>

        <h1 className="mt-8 text-4xl font-semibold tracking-tight">
          Thank you — we&apos;ll confirm once we see it.
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink/75">
          Your note is with us. It isn&apos;t a receipt yet: someone will match
          it against our bank statement, usually within a couple of working
          days, and email you when it&apos;s confirmed.
        </p>

        {ref ? (
          <p className="mt-8 inline-block rounded-lg border border-border bg-surface px-5 py-3 text-sm shadow-soft">
            Your reference{" "}
            <strong className="ml-1 font-medium tracking-wide text-navy">
              {ref}
            </strong>
          </p>
        ) : null}

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/programs" className={buttonVariants()}>
            See what it goes towards
          </Link>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Back to home
          </Link>
        </div>
      </Container>
    </Section>
  );
}
