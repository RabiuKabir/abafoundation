import Link from "next/link";

import { Container } from "@/components/ui/container";

const columns = [
  {
    heading: "Foundation",
    links: [
      { href: "/about", label: "About us" },
      { href: "/programs", label: "Programs" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    heading: "Support",
    links: [
      { href: "/donate", label: "Donate" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="mt-auto bg-navy-deep text-cream/70">
      <Container className="grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr] md:py-20">
        <div className="max-w-sm">
          <p className="font-heading text-xl font-semibold text-cream">
            ABA Foundation
          </p>
          <p className="mt-4 text-sm leading-relaxed">
            We work alongside communities to make clean water, schooling and
            steady income ordinary things — not lucky ones.
          </p>
        </div>

        {columns.map((column) => (
          <nav key={column.heading} aria-label={column.heading}>
            <p className="text-xs font-semibold tracking-[0.14em] text-cream/50 uppercase">
              {column.heading}
            </p>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors hover:text-cream"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-6 text-xs text-cream/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} ABA Foundation. All rights reserved.</p>
          <p>Registered charity — donations are received by bank transfer.</p>
        </Container>
      </div>
    </footer>
  );
}
