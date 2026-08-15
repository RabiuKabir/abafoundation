import { redirect } from "next/navigation";

import { Sidebar } from "@/components/admin/sidebar";
import { signOut } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";

/**
 * Admin shell — dark navy sidebar + light warm content area.
 *
 * The layout resolves the user from the database (not the token) and every
 * page inside re-checks its own permission. Middleware is the first gate,
 * not the only one.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex min-h-screen bg-admin-bg">
      <Sidebar user={user} signOutAction={signOutAction} />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 px-8 py-10">{children}</main>
      </div>
    </div>
  );
}
