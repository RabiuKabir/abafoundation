import { Container, Section } from "@/components/ui/container";

export const metadata = {
  title: "Terms",
  description: "The terms that apply to using this site and donating through it.",
};

export default function Page() {
  return (
    <Section>
      <Container width="narrow">
        <h1 className="text-4xl font-semibold tracking-tight">Terms</h1>
        <p
          role="note"
          className="mt-6 rounded-lg border border-warning/25 bg-warning/10 px-5 py-4 text-sm leading-relaxed text-warning"
        >
          <strong>This is a working draft, not legal advice.</strong> It describes
          what the site actually does today so the page isn&apos;t empty. It needs
          replacing with text a lawyer has looked at before launch.
        </p>
        <div className="mt-10 grid gap-6 text-lg leading-relaxed text-ink/80">
          <h2 className="text-2xl font-semibold tracking-tight text-navy">Donations</h2>
          <p>
            This site does not process payments. Donations reach us by bank transfer
            made from your own bank. Telling us about a transfer through the form is
            not itself a payment, and is not a receipt.
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-navy">Confirmation</h2>
          <p>
            A donation counts only once a member of our team has matched it against
            our bank statement. Until then it is pending. We will email you either way.
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-navy">Content</h2>
          <p>
            The stories on this site describe work we have done. Photographs are used
            with permission where they show identifiable people.
          </p>
        </div>
      </Container>
    </Section>
  );
}
