import { Sidebar } from "@/components/admin/sidebar";

/**
 * Admin shell — dark navy sidebar + light warm content area.
 * Phase 1 adds `middleware.ts` in front of this and a `can()` check inside
 * every route. Nothing here is protected yet.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-admin-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 px-8 py-10">{children}</main>
      </div>
    </div>
  );
}
