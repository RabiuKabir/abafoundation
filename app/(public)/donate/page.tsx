import { Container, Section } from "@/components/ui/container";
import { getBankDetails } from "@/lib/settings";
import { PledgeForm } from "./pledge-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Donate",
  description:
    "Give to ABA Foundation by bank transfer. Every transfer is confirmed by hand against our statement.",
};

export default async function DonatePage() {
  const bank = await getBankDetails();

  const rows = bank
    ? [
        { label: "Account name", value: bank.accountName },
        { label: "Account number", value: bank.accountNumber },
        { label: "Bank", value: bank.bankName },
      ]
    : [];

  return (
    <Section>
      <Container>
        <div className="grid gap-14 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Give by bank transfer
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-ink/75">
              We don&apos;t take card payments. Money comes to us by transfer,
              and a person checks every one of them against our bank statement
              before it counts.
            </p>

            {bank ? (
              <div className="mt-10 rounded-xl border border-border bg-surface p-7 shadow-soft">
                <h2 className="font-heading text-lg font-semibold text-navy">
                  Our account
                </h2>

                {bank.demo ? (
                  <p
                    role="alert"
                    className="mt-4 rounded-lg border border-warning/25 bg-warning/10 px-4 py-3 text-sm leading-relaxed text-warning"
                  >
                    <strong>These are placeholder details.</strong> Please
                    don&apos;t send anything yet — the real account has not been
                    entered.
                  </p>
                ) : null}

                <dl className="mt-5 grid gap-4">
                  {rows.map((row) => (
                    <div key={row.label} className="flex flex-wrap justify-between gap-2">
                      <dt className="text-sm text-muted-foreground">{row.label}</dt>
                      <dd className="font-medium text-navy tabular-nums">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <p className="mt-6 border-t border-border pt-5 text-sm leading-relaxed text-ink/75">
                  <strong className="text-navy">What to quote:</strong>{" "}
                  {bank.referenceHint}
                </p>
              </div>
            ) : (
              <p className="mt-10 rounded-lg border border-border bg-surface px-5 py-4 text-sm text-muted-foreground">
                Our bank details aren&apos;t published yet. Please use the
                contact page and we&apos;ll send them to you directly.
              </p>
            )}

            <div className="mt-10 grid gap-4 text-sm leading-relaxed text-ink/75">
              <p>
                <strong className="text-navy">1.</strong> Make the transfer from
                your bank, quoting the reference above.
              </p>
              <p>
                <strong className="text-navy">2.</strong> Tell us about it using
                the form — this is optional, but it makes matching much faster.
              </p>
              <p>
                <strong className="text-navy">3.</strong> We check the statement
                and email you once it&apos;s confirmed.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-8 shadow-soft sm:p-10">
            <h2 className="font-heading text-2xl font-semibold text-navy">
              Notify us of your transfer
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Optional, and it takes a minute. It tells us what to look for.
            </p>
            <div className="mt-8">
              <PledgeForm />
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
