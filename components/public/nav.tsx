"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

const links = [
  { href: "/about", label: "About" },
  { href: "/programs", label: "Programs" },
  { href: "/contact", label: "Contact" },
] as const;

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-cream/85 backdrop-blur-md">
      <Container className="flex h-18 items-center justify-between gap-6">
        <Link
          href="/"
          className="flex items-baseline gap-2 rounded-button font-heading text-xl font-semibold tracking-tight text-navy"
        >
          ABA
          <span className="text-sm font-normal tracking-[0.2em] text-muted-foreground uppercase">
            Foundation
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-button px-3.5 py-2 text-sm font-medium transition-colors",
                  active ? "text-teal" : "text-ink/75 hover:text-teal"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/donate"
            className={cn(buttonVariants({ variant: "donate", size: "sm" }), "ml-3")}
          >
            Donate
          </Link>
        </nav>

        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <XIcon /> : <MenuIcon />}
        </Button>
      </Container>

      {open ? (
        <div id="mobile-nav" className="border-t border-border bg-cream md:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                className="rounded-button px-2 py-2.5 text-sm font-medium text-ink/80"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/donate"
              onClick={close}
              className={cn(buttonVariants({ variant: "donate" }), "mt-3")}
            >
              Donate
            </Link>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
