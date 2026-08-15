/**
 * Authorization — Hard Rule 2.
 *
 * Every protected route calls `can()` BEFORE doing anything else. The UI only
 * hides what the server already forbids; hiding a menu item is not a control.
 *
 * Deny by default: an action that isn't listed for a role is refused, and an
 * unknown action is refused for everyone. Adding a route means adding its
 * action here deliberately — forgetting to fails closed, not open.
 *
 * This file is edge-safe: no database, no Node built-ins. middleware.ts and
 * route handlers both use it.
 */

export type Role = "admin" | "editor";

export type Action =
  // Content
  | "activities.read.any"
  | "activities.create"
  | "activities.update.own"
  | "activities.update.any"
  | "activities.delete"
  | "activities.submit"
  | "activities.publish"
  // Media
  | "media.create"
  | "media.read.own"
  | "media.read.any"
  | "media.delete"
  // Donations — Admin only, including the confirm/reject decision
  | "donations.read"
  | "donations.create"
  | "donations.update"
  | "donations.delete"
  | "donations.confirm"
  // Everything else is Admin-only
  | "reports.read"
  | "messages.read"
  | "messages.update"
  | "messages.delete"
  | "users.read"
  | "users.create"
  | "users.update"
  | "users.delete"
  | "settings.read"
  | "settings.update"
  | "audit.read";

/** Straight from the permission matrix in AGENT_BUILD_SPEC.md. */
const PERMISSIONS: Record<Role, ReadonlySet<Action>> = {
  admin: new Set<Action>([
    "activities.read.any",
    "activities.create",
    "activities.update.own",
    "activities.update.any",
    "activities.delete",
    "activities.submit",
    "activities.publish",
    "media.create",
    "media.read.own",
    "media.read.any",
    "media.delete",
    "donations.read",
    "donations.create",
    "donations.update",
    "donations.delete",
    "donations.confirm",
    "reports.read",
    "messages.read",
    "messages.update",
    "messages.delete",
    "users.read",
    "users.create",
    "users.update",
    "users.delete",
    "settings.read",
    "settings.update",
    "audit.read",
  ]),
  // Editors touch content only — their own drafts, submitted for approval.
  // No donations, no users, no settings, no reports, no audit log.
  editor: new Set<Action>([
    "activities.read.any",
    "activities.create",
    "activities.update.own",
    "activities.submit",
    "media.create",
    "media.read.own",
  ]),
};

/** The shape `can()` needs. Anything with a role and an active flag fits. */
export type Actor = { role: Role; active: boolean } | null | undefined;

export function can(user: Actor, action: Action): boolean {
  if (!user) return false;
  // A deactivated account keeps its role but loses every permission.
  if (!user.active) return false;
  return PERMISSIONS[user.role]?.has(action) ?? false;
}

/**
 * Which admin sections a role may open. Used by middleware to gate whole
 * route trees, and by the sidebar to hide what the server would refuse.
 * Keep in step with the route folders under app/(admin).
 */
export const SECTION_ACTIONS: Record<string, Action> = {
  dashboard: "activities.read.any",
  activities: "activities.create",
  approvals: "activities.publish",
  donations: "donations.read",
  reports: "reports.read",
  messages: "messages.read",
  users: "users.read",
  audit: "audit.read",
  settings: "settings.read",
};

/** Resolve a pathname like /donations/123 to the action guarding it. */
export function actionForPath(pathname: string): Action | undefined {
  const section = pathname.split("/").filter(Boolean)[0];
  return section ? SECTION_ACTIONS[section] : undefined;
}
