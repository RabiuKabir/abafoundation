import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/container";

export const metadata = {
  title: "About",
  description:
    "Who ABA Foundation is, how we decide where to work, and how the money is handled.",
};

const numbers = [
  { value: "2019", label: "Working since" },
  { value: "4", label: "Programme areas" },
  { value: "100%", label: "Donations confirmed by hand" },
];

export default function AboutPage() {
  return (
    <>
      <Section spacing="loose">
        <Container width="narrow">
          <p className="text-xs font-semibold tracking-[0.16em] text-teal uppercase">
            About us
          </p>
          <h1 className="mt-5 text-4xl leading-[1.1] font-semibold tracking-tight sm:text-5xl">
            We started with one school fee and a spreadsheet.
          </h1>
          <p className="mt-7 text-lg leading-relaxed text-ink/75">
            ABA Foundation began in 2019, when a handful of us pooled what we
            could to keep three children in school for a year. There was no
            office and no plan beyond that year. What there was — and what we
            have kept — is a habit of writing down exactly where every naira
            went, and going back the following year to see whether it had
            worked.
          </p>
        </Container>
      </Section>

      <Container>
        <div className="relative aspect-[16/9] overflow-hidden rounded-xl shadow-soft">
          <Image
            src="https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=1600&q=80"
            alt="Children sitting together on the floor of a village classroom during a lesson"
            fill
            sizes="(min-width: 1100px) 1100px, 100vw"
            className="object-cover"
          />
        </div>
      </Container>

      <Section spacing="tight">
        <Container width="narrow">
          <h2 className="text-3xl font-semibold tracking-tight">
            How we decide where to work
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ink/75">
            We work in the places we come from, because that is where we can
            check. Someone from the foundation knows the head teacher, the ward
            head, the woman running the stall. That is not sentiment — it is the
            cheapest form of verification we have found.
          </p>
          <p className="mt-5 text-lg leading-relaxed text-ink/75">
            We say no to more than we say yes to. A borehole nobody has been
            trained to repair is a photograph, not a water supply. If we cannot
            see who will look after something in year three, we would rather put
            the money where someone will.
          </p>

          <h2 className="mt-14 text-3xl font-semibold tracking-tight">
            How the money is handled
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ink/75">
            Donations reach us by bank transfer. Nothing is counted as received
            until a person has matched it against the bank statement — no
            automatic confirmations, no numbers on this site that a real deposit
            does not stand behind. When you give, you will hear from a person.
          </p>

          <dl className="mt-12 grid gap-8 border-t border-border pt-10 sm:grid-cols-3">
            {numbers.map((n) => (
              <div key={n.label}>
                <dt className="text-sm text-muted-foreground">{n.label}</dt>
                <dd className="mt-1 font-heading text-3xl font-semibold text-navy">
                  {n.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-14 flex flex-wrap gap-3">
            <Link href="/programs" className={buttonVariants()}>
              See what we&apos;ve done
            </Link>
            <Link href="/contact" className={buttonVariants({ variant: "outline" })}>
              Get in touch
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
