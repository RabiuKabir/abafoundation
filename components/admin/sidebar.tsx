"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BanknoteIcon,
  ClipboardCheckIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  MailIcon,
  ScrollTextIcon,
  SettingsIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Admin sidebar shell — dark navy rail beside a light warm content area.
 * `roles` is the menu-visibility hint only. Phase 1 adds the real gate:
 * every route re-checks `can(user, action)` on the server. Deny by default.
 */
const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon, roles: ["admin", "editor"] },
  { href: "/activities", label: "Activities", icon: FileTextIcon, roles: ["admin", "editor"] },
  { href: "/approvals", label: "Approvals", icon: ClipboardCheckIcon, roles: ["admin"] },
  { href: "/donations", label: "Donations", icon: BanknoteIcon, roles: ["admin"] },
  { href: "/reports", label: "Reports", icon: TrendingUpIcon, roles: ["admin"] },
  { href: "/messages", label: "Messages", icon: MailIcon, roles: ["admin"] },
  { href: "/users", label: "Users", icon: UsersIcon, roles: ["admin"] },
  { href: "/audit", label: "Audit log", icon: ScrollTextIcon, roles: ["admin"] },
  { href: "/settings", label: "Settings", icon: SettingsIcon, roles: ["admin"] },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-18 items-center gap-2 px-6">
        <Link
          href="/dashboard"
          className="font-heading text-lg font-semibold tracking-tight text-white"
        >
          ABA
          <span className="ml-2 text-[0.7rem] font-normal tracking-[0.18em] text-sidebar-foreground/60 uppercase">
            Admin
          </span>
        </Link>
      </div>

      <nav aria-label="Admin" className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-button px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-6 py-5 text-xs text-sidebar-foreground/60">
        Signed in as <span className="text-sidebar-foreground">Admin</span>
        <p className="mt-1 text-sidebar-foreground/40">Auth arrives in Phase 1.</p>
      </div>
    </aside>
  );
}
