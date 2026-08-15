import { Container, Section } from "@/components/ui/container";
import { ContactForm } from "./contact-form";

export const metadata = {
  title: "Contact",
  description:
    "Get in touch with ABA Foundation — questions, partnerships, or to tell us about a transfer.",
};

export default function ContactPage() {
  return (
    <Section>
      <Container>
        <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Get in touch
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-ink/75">
              Questions about the work, a partnership, or letting us know about
              a transfer you&apos;ve made — this reaches a person, not a queue.
            </p>

            <dl className="mt-10 grid gap-6 text-sm">
              <div>
                <dt className="font-medium text-navy">Email</dt>
                <dd className="mt-1 text-muted-foreground">
                  hello@abafoundation.org
                </dd>
              </div>
              <div>
                <dt className="font-medium text-navy">Telling us about a transfer?</dt>
                <dd className="mt-1 leading-relaxed text-muted-foreground">
                  Include the date, amount and the reference you quoted, and
                  we&apos;ll match it against our statement.
                </dd>
              </div>
              <div>
                <dt className="font-medium text-navy">Response time</dt>
                <dd className="mt-1 text-muted-foreground">
                  Usually a couple of working days.
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-border bg-surface p-8 shadow-soft sm:p-10">
            <ContactForm />
          </div>
        </div>
      </Container>
    </Section>
  );
}
