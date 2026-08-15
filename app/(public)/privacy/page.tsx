import { Container, Section } from "@/components/ui/container";

export const metadata = {
  title: "Privacy",
  description: "How ABA Foundation handles the personal information you give us.",
};

export default function Page() {
  return (
    <Section>
      <Container width="narrow">
        <h1 className="text-4xl font-semibold tracking-tight">Privacy</h1>
        <p
          role="note"
          className="mt-6 rounded-lg border border-warning/25 bg-warning/10 px-5 py-4 text-sm leading-relaxed text-warning"
        >
          <strong>This is a working draft, not legal advice.</strong> It describes
          what the site actually does today so the page isn&apos;t empty. It needs
          replacing with text a lawyer has looked at before launch.
        </p>
        <div className="mt-10 grid gap-6 text-lg leading-relaxed text-ink/80">
          <h2 className="text-2xl font-semibold tracking-tight text-navy">What we collect</h2>
          <p>
            If you use the contact form we store your name, email and message. If
            you tell us about a bank transfer we store your name, email, the amount,
            the date and the reference you quoted, plus any screenshot you attach.
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-navy">Why</h2>
          <p>
            To reply to you, and to match transfers against our bank statement so we
            can confirm them. We only email you about the work if you tick the box
            asking us to.
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-navy">Who sees it</h2>
          <p>
            Foundation staff with an admin account. We do not sell it, and we do not
            pass it to anyone else except the services that host this site and its
            database.
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-navy">Asking us to delete it</h2>
          <p>
            Email us and we will, except where we have to keep a record of a donation
            for accounting.
          </p>
        </div>
      </Container>
    </Section>
  );
}
