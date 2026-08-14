# Foundation Web App — Build Spec (for a coding agent)

**How to use this file:** put it in the repo root next to DESIGN_SYSTEM.md. Tell your coding agent:
*"Build this app by following AGENT_BUILD_SPEC.md and DESIGN_SYSTEM.md. Do the phases in order. After each phase, stop and show me it meets the ✅ gate before moving on."*

Keep changes small and phase-scoped. Do not skip the **Hard Rules**.

---

## Hard Rules (never break these)
1. **Donations are confirmed by a human, never by the public form.** A donor's "I transferred" submission is always `pending`. A donation becomes `confirmed` only when a **Finance** user verifies it against the bank statement. Totals count **confirmed** only.
2. **Authorization is enforced on the server** in every API route via `can(user, action)`. The UI only hides what the server already forbids. Deny by default.
3. **Validate every input** on the server (zod). Use the ORM (no hand-built SQL).
4. **No secrets in the repo.** Everything via `.env`.
5. **Database is MySQL 8+** with **Drizzle ORM**.

---

## Stack (decided)
- **Framework:** Next.js (App Router, React Server Components) + **TypeScript** — one project for public site, admin, and API.
- **Styling/UI:** Tailwind CSS + **shadcn/ui** (themed with DESIGN_SYSTEM.md tokens).
- **Database:** **MySQL 8+** on a serverless provider (**PlanetScale**), via **Drizzle ORM** + drizzle-kit migrations.
- **Auth:** **Auth.js (NextAuth)** credentials + roles (primary). *Alternative: Clerk* if you'd rather offload auth entirely — but then roles live in Clerk metadata and `can()` reads from there.
- **Payments:** **None (bank transfer).** No gateway, no card handling. See Donations below.
- **Email:** Resend (pledge acknowledgements, invites, resets, contact/finance alerts).
- **File storage:** S3-compatible (Cloudflare R2 / AWS S3), signed uploads — for activity media **and** payment-proof screenshots.
- **Deploy:** **Vercel or Netlify.** Deploy on `git push`.
- **Safety net:** Sentry (errors) + provider daily backups.

> **DB provider note:** PlanetScale = serverless **MySQL** (this spec). It disables foreign-key *constraints* by default — that's fine, Drizzle models relations in code. If you'd rather use **Neon**, that's **Postgres**, not MySQL — switching Drizzle from `mysql-core` to `pg-core` is a small change; ask and I'll flip the spec.

---

## Environment variables (`.env`)
```
DATABASE_URL="mysql://user:pass@host:3306/ngo"
AUTH_SECRET=...
AUTH_URL=https://yourdomain.org
RESEND_API_KEY=...
EMAIL_FROM="Hope Foundation <hello@yourdomain.org>"
S3_BUCKET=...  S3_REGION=...  S3_ACCESS_KEY=...  S3_SECRET_KEY=...   # media + payment proofs
SENTRY_DSN=...
```

---

## Roles & permissions (enforce server-side)
`C`reate `R`ead `U`pdate `D`elete `A`pprove/publish · `—` none

| Resource | Owner | Admin | Finance | Editor | Public |
|---|---|---|---|---|---|
| Content/activities | CRUD·A | CRUD·A | R | CRU own drafts + submit | R published |
| Media | CRUD | CRUD | — | C·R own | R |
| Donations | R | R | **CRUD + confirm/reject** | — | C (pledge form) · own receipt |
| Reports/export | R | R | R | — | — |
| Contact messages | CRUD | CRUD | — | — | C (submit) |
| Users & roles | CRUD | — | — | — | — |
| Settings (incl. bank details) | CRU | U (safe) | — | — | — |
| Audit log | R | R | R | — | — |

Implement one helper: `can(user, action)` in `lib/rbac.ts`. Every protected route calls it first.

---

## Donations = Bank Transfer (how it works)
1. **Donate page (public):** shows the NGO's bank details (account name, number, bank, and a reference to quote) + an optional form: name, email, amount, transfer date, reference, optional proof screenshot. Submitting creates a Donation with `status = pending`.
2. **Acknowledgement:** donor gets a "received — pending confirmation" email; Finance gets an alert.
3. **Finance confirms:** Finance checks the real bank statement, then marks each pending donation `confirmed` (or `rejected`). Finance can also add a donation directly (cash/bank they saw on the statement).
4. **Reporting counts `confirmed` only.** Every confirm/reject writes to the audit log.

---

## Data model (Drizzle — MySQL) → `db/schema.ts`
```ts
import { mysqlTable, varchar, text, boolean, timestamp, datetime,
         decimal, mysqlEnum, json } from "drizzle-orm/mysql-core";
import { createId } from "@paralleldrive/cuid2";
const id = () => varchar("id",{length:24}).primaryKey().$defaultFn(() => createId());
const ROLES = ["owner","admin","finance","editor"] as const;

export const users = mysqlTable("users", {
  id: id(),
  name: varchar("name",{length:255}).notNull(),
  email: varchar("email",{length:255}).notNull().unique(),
  passwordHash: varchar("password_hash",{length:255}).notNull(),
  role: mysqlEnum("role", ROLES).notNull().default("editor"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const invites = mysqlTable("invites", {
  id: id(),
  email: varchar("email",{length:255}).notNull(),
  role: mysqlEnum("role", ROLES).notNull(),
  tokenHash: varchar("token_hash",{length:255}).notNull(),
  expiresAt: datetime("expires_at").notNull(),
  acceptedAt: datetime("accepted_at"),
});

export const categories = mysqlTable("categories", {
  id: id(),
  name: varchar("name",{length:120}).notNull(),
  slug: varchar("slug",{length:140}).notNull().unique(),
});

export const activities = mysqlTable("activities", {
  id: id(),
  title: varchar("title",{length:255}).notNull(),
  slug: varchar("slug",{length:280}).notNull().unique(),
  summary: text("summary").notNull(),
  body: text("body").notNull(),
  status: mysqlEnum("status",["draft","in_review","published","archived"]).notNull().default("draft"),
  categoryId: varchar("category_id",{length:24}).notNull(),
  coverMediaId: varchar("cover_media_id",{length:24}),
  authorId: varchar("author_id",{length:24}).notNull(),
  publishedAt: datetime("published_at"),
  seoTitle: varchar("seo_title",{length:255}),
  seoDescription: text("seo_description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  deletedAt: datetime("deleted_at"),
});

export const media = mysqlTable("media", {
  id: id(),
  activityId: varchar("activity_id",{length:24}),
  url: varchar("url",{length:600}).notNull(),
  type: mysqlEnum("type",["image","video"]).notNull().default("image"),
  altText: varchar("alt_text",{length:300}).notNull(),
  createdById: varchar("created_by_id",{length:24}).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const donations = mysqlTable("donations", {
  id: id(),
  donorName: varchar("donor_name",{length:255}),
  donorEmail: varchar("donor_email",{length:255}),
  amount: decimal("amount",{precision:10,scale:2}).notNull(),
  currency: varchar("currency",{length:3}).notNull().default("USD"),
  method: mysqlEnum("method",["bank_transfer","cash"]).notNull().default("bank_transfer"),
  reference: varchar("reference",{length:120}),          // what the donor quoted on the transfer
  transferredAt: datetime("transferred_at"),
  proofUrl: varchar("proof_url",{length:600}),           // optional screenshot
  status: mysqlEnum("status",["pending","confirmed","rejected"]).notNull().default("pending"),
  activityId: varchar("activity_id",{length:24}),
  receiptNo: varchar("receipt_no",{length:60}),
  consentContact: boolean("consent_contact").notNull().default(false),
  confirmedById: varchar("confirmed_by_id",{length:24}), // which Finance user confirmed
  confirmedAt: datetime("confirmed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const contacts = mysqlTable("contacts", {
  id: id(),
  name: varchar("name",{length:255}).notNull(),
  email: varchar("email",{length:255}).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status",["new","handled"]).notNull().default("new"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditLogs = mysqlTable("audit_logs", {
  id: id(),
  userId: varchar("user_id",{length:24}),
  action: varchar("action",{length:120}).notNull(),
  entity: varchar("entity",{length:60}).notNull(),
  entityId: varchar("entity_id",{length:24}),
  meta: json("meta"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const settings = mysqlTable("settings", {   // org details, bank details, SEO defaults
  key: varchar("key",{length:100}).primaryKey(),
  value: json("value").notNull(),
});
```

---

## Folder structure (Next.js App Router + Drizzle)
```
app/
  (public)/  page.tsx  about/  programs/  programs/[slug]/  donate/  donate/thanks/  contact/  privacy/  terms/
  (admin)/   layout.tsx  dashboard/  activities/  approvals/  donations/  reports/  messages/  users/  audit/  settings/
  login/     page.tsx
  api/
    auth/[...nextauth]/route.ts
    activities/route.ts            (+ [id]/route.ts, [id]/publish/route.ts)
    media/route.ts
    donations/route.ts             (public pledge create)
    donations/[id]/confirm/route.ts (Finance confirm/reject)  ·  donations/offline/route.ts
    contact/route.ts
    users/route.ts
    reports/route.ts
components/  ui/  public/  admin/
lib/  db.ts  auth.ts  rbac.ts  mail.ts  storage.ts  audit.ts  validation.ts
db/   schema.ts  migrations/  seed.ts
drizzle.config.ts
middleware.ts        ← protects /(admin)
.env
```

---

## Pages & key UI (follow DESIGN_SYSTEM.md — minimalist, warm, editorial)
**Public**
- **Home** — hero + "Donate" CTA + 3 featured activities + footer.
- **About** — mission/history + team.
- **Programs** — category filter chips + card grid + pagination.
- **Activity detail** — category/date, cover image, story, media gallery, inline Donate CTA.
- **Donate** — bank details + reference instructions + optional "Notify us of your transfer" form (name, email, amount, date, reference, optional proof upload).
- **Donate → thanks** — "Thank you — we'll confirm once we see your transfer." (status is pending, not "paid").
- **Contact** — name/email/message (honeypot + rate limit) + embedded map.
- **404/500** — friendly, one link home.

**Admin** (dark sidebar + light content shell; menu items shown per role)
- **Login** — email/password + forgot-password.
- **Dashboard** — KPI row (confirmed raised 30d, pending pledges, pending reviews, new messages) + recent donations.
- **Activities** — table with status badges; Editors see only their drafts.
- **Activity editor** — title, category, date, cover upload (alt text), body, collapsible SEO; Save draft / Submit.
- **Approvals** — queue of submitted drafts; Approve & publish / Return with note.
- **Donations** — filter by status (pending/confirmed/rejected) & method; **Confirm / Reject** pending pledges; "+ Add donation" (offline); view proof.
- **Reports** — date/category filter, confirmed totals, breakdown, Export CSV.
- **Messages** — contact inbox with new/handled status.
- **Users** — Owner only: invite, assign role, deactivate.
- **Settings** — org details, **bank details shown on Donate page**, categories (Admin); nothing here needs card keys.
- **Audit log** — read-only trail of sensitive actions.

*(Visual reference: the delivered `build_guide.html` mockups — same layouts. On the Donate page, replace the Stripe panel with the bank-details + pledge form.)*

---

## Build tasks (do in order; stop at each ✅ gate)

### Phase 0 — Setup
- [ ] Scaffold Next.js + TS + Tailwind + shadcn/ui; build design tokens + base components from DESIGN_SYSTEM.md first.
- [ ] Add Drizzle + drizzle-kit; set MySQL (PlanetScale) connection; create `db/schema.ts` above; run first migration.
- [ ] Base public layout + admin shell; seed script creates one Owner from the email you provide.
- [ ] Deploy to Vercel/Netlify; set env vars.
- **✅ Gate:** app deploys to a live URL and the migration runs clean on MySQL.

### Phase 1 — Auth & RBAC
- [ ] Auth.js credentials login; hash passwords (argon2/bcrypt).
- [ ] Invite flow (Owner invites → email link → set password → verify).
- [ ] Password reset (no enumeration, expiring single-use token).
- [ ] `lib/rbac.ts` `can()` + `middleware.ts` guarding `(admin)`.
- **✅ Gate:** a non-Owner is rejected **by the server** from a users-only route (not just a hidden menu).

### Phase 2 — Content & Public Site
- [ ] Activities/Categories/Media wired; media upload (validate type/size, require alt text).
- [ ] Activity CRUD with `draft → in_review → published → archived`.
- [ ] Public pages: Home, About, Programs (filter + pagination), Activity detail, Contact (honeypot + rate limit).
- [ ] SEO fields, sitemap.xml, robots.txt, 404/500; accessibility pass (keyboard, contrast, labels, alt text).
- **✅ Gate:** an Editor's draft cannot appear publicly until an Admin approves it.

### Phase 3 — Donations (bank transfer)
- [ ] Donations schema; Settings holds the bank details.
- [ ] Public Donate page: bank details + optional pledge form (creates `pending`, optional proof upload).
- [ ] Emails: donor acknowledgement ("pending confirmation") + Finance alert.
- [ ] Finance: list pending, **Confirm/Reject** (writes audit), and "+ Add donation" (offline).
- **✅ Gate:** a public pledge stays `pending` until Finance confirms; reports count only `confirmed`.

### Phase 4 — Admin & Reports
- [ ] Dashboard metrics; approval queue; contact inbox (new/handled).
- [ ] Users management (Owner): invite, role, deactivate (reassign that user's drafts to Admin on deactivate).
- [ ] Reports: date/category/status filter + confirmed totals + CSV export.
- [ ] Audit log write on sensitive actions + read-only viewer.
- [ ] Settings: org details, bank details, categories.
- **✅ Gate:** every donation confirm/reject and role change appears in the audit log; Finance can export a CSV.

### Phase 5 — Security, Polish & Launch
- [ ] Server-side validation everywhere; rate limits on auth/contact/pledge; secure headers + CORS.
- [ ] Accessibility + mobile pass; wire Sentry.
- [ ] Confirm managed DB backups on; run **one real restore drill**.
- [ ] Connect domain + TLS; manual UAT with real staff.
- **✅ Gate:** restore-from-backup succeeds; no high/critical security or accessibility issue open.

---

## Deferred (do NOT build now)
Online card/gateway payments (Stripe/PayPal), CI/CD pipelines, Redis, containers/K8s, APM suites, recurring giving, newsletter, events/RSVP, public donor accounts. All can be added later without rework.

---

## Decisions needed from the product owner (agent: ask if unset)
1. **Currency** (e.g. USD, NGN, SAR) — drives display + the `currency` default.
2. **First Owner email** — for the seed script.
3. **Bank details** to show on the Donate page: account name, account number/IBAN, bank name, and what reference donors should quote.
4. **DB choice** — MySQL + PlanetScale (this spec) or switch to Postgres + Neon? (Drizzle handles either.)
5. **Auth** — Auth.js (in-app roles) or Clerk (hosted auth)?
6. Verified sending domain + "from" email for acknowledgements.
7. Real privacy policy / terms text and logo/brand assets.
