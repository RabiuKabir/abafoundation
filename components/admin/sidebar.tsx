"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BanknoteIcon,
  ClipboardCheckIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MailIcon,
  ScrollTextIcon,
  SettingsIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { can, type Action, type Role } from "@/lib/rbac";

/**
 * Admin sidebar. Items are filtered by the same `can()` the server uses, so
 * the menu matches reality — but hiding a link is cosmetic only. Every route
 * behind these links re-checks permission on the server (lib/session.ts).
 */
const items: { href: string; label: string; icon: typeof UsersIcon; action: Action }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon, action: "activities.read.any" },
  { href: "/activities", label: "Activities", icon: FileTextIcon, action: "activities.create" },
  { href: "/approvals", label: "Approvals", icon: ClipboardCheckIcon, action: "activities.publish" },
  { href: "/donations", label: "Donations", icon: BanknoteIcon, action: "donations.read" },
  { href: "/reports", label: "Reports", icon: TrendingUpIcon, action: "reports.read" },
  { href: "/messages", label: "Messages", icon: MailIcon, action: "messages.read" },
  { href: "/users", label: "Users", icon: UsersIcon, action: "users.read" },
  { href: "/audit", label: "Audit log", icon: ScrollTextIcon, action: "audit.read" },
  { href: "/settings", label: "Settings", icon: SettingsIcon, action: "settings.read" },
];

export function Sidebar({
  user,
  signOutAction,
}: {
  user: { name: string; email: string; role: Role; active: boolean };
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const visible = items.filter((item) => can(user, item.action));

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-18 items-center px-6">
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
        {visible.map((item) => {
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

      <div className="border-t border-sidebar-border px-6 py-5">
        <p className="truncate text-sm font-medium text-sidebar-foreground">
          {user.name}
        </p>
        <p className="truncate text-xs text-sidebar-foreground/60">
          {user.email} · {user.role}
        </p>
        <form action={signOutAction} className="mt-3">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-button text-xs text-sidebar-foreground/70 transition-colors hover:text-white"
          >
            <LogOutIcon className="size-3.5" aria-hidden="true" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
