# Foundation Web App — Build Spec (for a coding agent)

**How to use this file:** put it in the repo root next to DESIGN_SYSTEM.md. Tell your coding agent:
*"Build this app by following AGENT_BUILD_SPEC.md and DESIGN_SYSTEM.md. Do the phases in order. After each phase, stop and show me it meets the ✅ gate before moving on."*

Keep changes small and phase-scoped. Do not skip the **Hard Rules**.

---

## Hard Rules (never break these)
1. **Donations are confirmed by a human, never by the public form.** A donor's "I transferred" submission is always `pending`. A donation becomes `confirmed` only when an **Admin** verifies it against the bank statement. Totals count **confirmed** only.
2. **Authorization is enforced on the server** in every API route via `can(user, action)`. The UI only hides what the server already forbids. Deny by default.
3. **Validate every input** on the server (zod). Use the ORM (no hand-built SQL).
4. **No secrets in the repo.** Everything via `.env`.
5. **Database is PostgreSQL** (Supabase) with **Drizzle ORM**. *(Decided 15 Aug 2026 — was MySQL/PlanetScale; nothing had been applied, so the schema was ported to `pg-core` rather than migrated.)*

---

## Stack (decided)
- **Framework:** Next.js (App Router, React Server Components) + **TypeScript** — one project for public site, admin, and API.
- **Styling/UI:** Tailwind CSS + **shadcn/ui** (themed with DESIGN_SYSTEM.md tokens).
- **Database:** **PostgreSQL** on **Supabase**, via **Drizzle ORM** (`pg-core`) + drizzle-kit migrations.
- **Auth:** **Auth.js (NextAuth)** credentials + roles (`admin` / `editor`) (primary). *Alternative: Clerk* if you'd rather offload auth entirely — but then roles live in Clerk metadata and `can()` reads from there.
- **Payments:** **None (bank transfer).** No gateway, no card handling. See Donations below.
- **Email:** Resend (pledge acknowledgements, invites, resets, contact/finance alerts).
- **File storage:** S3-compatible signed uploads — for activity media **and** payment-proof screenshots. **Supabase Storage** is the default now that the DB lives there (S3-compatible endpoint, one less vendor); Cloudflare R2 / AWS S3 remain drop-in alternatives.
- **Deploy:** **Vercel or Netlify.** Deploy on `git push`.
- **Safety net:** Sentry (errors) + provider daily backups.

> **DB provider note:** Supabase = managed **PostgreSQL**. Two connection strings matter: the **transaction pooler** (port 6543) for the app at runtime — required on serverless, and prepared statements must be disabled — and the **direct** connection (port 5432) for drizzle-kit migrations and the seed script, because DDL needs a real session.
>
> **Supabase features we are deliberately NOT using:** Supabase Auth (Auth.js owns sessions and roles — do not introduce a second identity system) and Row Level Security. We connect as the Postgres owner from trusted server code, so **RLS is not a security boundary here**. Hard Rule 2 stands unchanged: authorization is `can(user, action)` in every route.

---

## Environment variables (`.env`)
```
DATABASE_URL="postgresql://...pooler.supabase.com:6543/postgres"   # app runtime (transaction pooler)
DIRECT_URL="postgresql://...pooler.supabase.com:5432/postgres"     # migrations + seed only
AUTH_SECRET=...
AUTH_URL=https://yourdomain.org
RESEND_API_KEY=...
EMAIL_FROM="Hope Foundation <hello@yourdomain.org>"
S3_BUCKET=...  S3_REGION=...  S3_ENDPOINT=...  S3_ACCESS_KEY=...  S3_SECRET_KEY=...   # media + payment proofs
                                # S3_ENDPOINT = https://PROJECT.supabase.co/storage/v1/s3 (blank for AWS)
SENTRY_DSN=...
```

---

## Roles & permissions (enforce server-side)
Two staff roles + the public. `C`reate `R`ead `U`pdate `D`elete `A`pprove/publish · `—` none

| Resource | Admin | Editor | Public |
|---|---|---|---|
| Content/activities | CRUD·A | CRU own drafts + submit | R published |
| Media | CRUD | C·R own | R |
| Donations | **CRUD + confirm/reject** | — | C (pledge form) · own receipt |
| Reports/export | R | — | — |
| Contact messages | CRUD | — | C (submit) |
| Users & roles | CRUD | — | — |
| Settings (incl. bank details) | CRU | — | — |
| Audit log | R | — | — |

- **Admin** = full power: manages and publishes content, confirms/rejects donations, manages users, edits settings, views reports and the audit log.
- **Editor** = content only: creates/edits their own activity drafts and submits them for approval; no access to donations, users, or settings.
- Every Admin is full-power (including managing other Admins), so keep the number of Admins small.

Implement one helper: `can(user, action)` in `lib/rbac.ts`. Every protected route calls it first.

---

## Donations = Bank Transfer (how it works)
1. **Donate page (public):** shows the NGO's bank details (account name, number, bank, and a reference to quote) + an optional form: name, email, amount, transfer date, reference, optional proof screenshot. Submitting creates a Donation with `status = pending`.
2. **Acknowledgement:** donor gets a "received — pending confirmation" email; Finance gets an alert.
3. **Admin confirms:** an Admin checks the real bank statement, then marks each pending donation `confirmed` (or `rejected`). An Admin can also add a donation directly (cash/bank they saw on the statement).
4. **Reporting counts `confirmed` only.** Every confirm/reject writes to the audit log.

---

## Data model (Drizzle — PostgreSQL) → `db/schema.ts`

**[`db/schema.ts`](db/schema.ts) is the authority — read it, do not retype it here.**
Same nine tables as the original MySQL draft (users, invites, categories,
activities, media, donations, contacts, audit_logs, settings) with identical
columns and semantics. Only the dialect changed:

| MySQL draft | PostgreSQL now | Note |
|---|---|---|
| `mysqlTable` | `pgTable` | from `drizzle-orm/pg-core` |
| `mysqlEnum(col, [...])` | `pgEnum(name, [...])` | Postgres enums are *named types*, declared once at module scope and reused (`role` is shared by users + invites) |
| `timestamp` / `datetime` | `timestamp({ withTimezone: true })` | one type for both; everything is `timestamptz` |
| `decimal(10,2)` | `numeric(10,2)` | still read back as a string — never do money maths in JS floats |
| `json` | `jsonb` | indexable |
| `.onUpdateNow()` | `.$onUpdate(() => new Date())` | **Drizzle-level, not a DB clause.** Raw SQL updates outside the ORM will not bump `updated_at` |

`donations.currency` defaults to `NGN`.

**Foreign keys are real, enforced constraints** (added 15 Aug 2026 — possible
now that we're on Postgres). Eight of them:

| Column | References | On delete | Why |
|---|---|---|---|
| `activities.category_id` | `categories.id` | **restrict** | a category in use cannot be deleted from Settings |
| `activities.author_id` | `users.id` | **restrict** | content keeps its author |
| `activities.cover_media_id` | `media.id` | set null | optional link; losing it costs nothing |
| `media.activity_id` | `activities.id` | set null | media may be detached and reused |
| `media.created_by_id` | `users.id` | **restrict** | upload attribution |
| `donations.activity_id` | `activities.id` | **restrict** | an activity with donations against it can never be deleted |
| `donations.confirmed_by_id` | `users.id` | **restrict** | who confirmed the money cannot be erased |
| `audit_logs.user_id` | `users.id` | set null | the log row must outlive the account |

`restrict` is the default for anything a financial or attribution trail depends
on. This assumes the Phase 4 rule that **staff are deactivated, never deleted**
— a delete that would orphan content or donations now fails at the database,
not silently. `activities.cover_media_id` ↔ `media.activity_id` is a deliberate
cycle; Drizzle needs an `AnyPgColumn` return annotation to resolve it.

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
    donations/[id]/confirm/route.ts (Admin confirm/reject)  ·  donations/offline/route.ts
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
- **Donations** — Admin: filter by status (pending/confirmed/rejected) & method; **Confirm / Reject** pending pledges; "+ Add donation" (offline); view proof.
- **Reports** — Admin: date/category filter, confirmed totals, breakdown, Export CSV.
- **Messages** — Admin: contact inbox with new/handled status.
- **Users** — Admin: invite, assign role (admin/editor), deactivate.
- **Settings** — Admin: org details, **bank details shown on Donate page**, categories; nothing here needs card keys.
- **Audit log** — read-only trail of sensitive actions.

*(Visual reference: the delivered `build_guide.html` mockups — same layouts. On the Donate page, replace the Stripe panel with the bank-details + pledge form.)*

---

## Build tasks (do in order; stop at each ✅ gate)

### Phase 0 — Setup
- [ ] Scaffold Next.js + TS + Tailwind + shadcn/ui; build design tokens + base components from DESIGN_SYSTEM.md first.
- [ ] Add Drizzle + drizzle-kit; set the Supabase Postgres connection (pooled + direct); create `db/schema.ts`; run first migration.
- [ ] Base public layout + admin shell; seed script creates one Admin from the email you provide.
- [ ] Deploy to Vercel/Netlify; set env vars.
- **✅ Gate:** app deploys to a live URL and the migration runs clean on Postgres.

### Phase 1 — Auth & RBAC  ✅ done 15 Aug 2026
- [x] Auth.js credentials login; bcrypt (cost 12). Generic failure message and a
      dummy-hash compare on unknown emails, so the form can't be used to
      discover which addresses have accounts.
- [x] `lib/rbac.ts` `can()` — deny by default, unknown action refused for
      everyone — plus `proxy.ts` (Next 16's name for `middleware.ts`) gating
      `(admin)`.
- [x] Admin creates accounts directly, with `must_change_password` forcing the
      owner to replace the temporary password before anything else loads.
- [x] Break glass: `SEED_ADMIN_FORCE_PASSWORD=true` resets an Admin password
      from the machine holding `.env`.

**Deferred until a verified sending domain exists** (decided 15 Aug 2026 —
Admin creates accounts by hand for now):
- [ ] Invite flow (Admin invites → email link → set password → verify).
- [ ] Password reset (no enumeration, expiring single-use token).

The `invites` table stays in the schema, unused, for when email lands. Note the
consequence: with no reset email, a forgotten Admin password has no in-app
recovery — the break-glass seed is the only way back.

**Two layers, deliberately.** `proxy.ts` runs on the edge and cannot reach the
database, so it checks only the JWT — a cheap first bounce. Every page and
route handler behind it re-checks against the database via `lib/session.ts`,
because a token is a snapshot from sign-in (deactivate someone and their old
token still claims they're active) and because a route must never assume
something upstream ran.

- **✅ Gate PASSED:** an Editor gets `403 {"error":"Not allowed."}` from the
  server on `GET/POST /api/users`, `/api/donations`, `/api/settings` and
  `/api/reports`, and is redirected away from those pages — verified with a
  real signed-in Editor session, not a hidden menu.

### Phase 2 — Content & Public Site  ✅ done 15 Aug 2026
- [x] Activities/Categories/Media wired. Categories seeded: Scholarships,
      Empowerments, Community Service, Helping the Needy.
- [x] Activity CRUD with `draft → in_review → published → archived`. Editors
      may edit only their own, and only while it is a draft — otherwise an
      approval could be rewritten after the fact.
- [x] Public pages: Home, About, Programs (category filter + pagination),
      Activity detail, Contact (honeypot + rate limit).
- [x] SEO fields per activity, sitemap.xml, robots.txt, 404 and 500.
- [x] Accessibility: axe-core clean (WCAG 2.1 A/AA) on all seven public pages;
      skip link, visible focus, every control labelled, no missing alt.
- [ ] **Media upload is written but UNTESTED** — waiting on Supabase Storage
      credentials. `lib/storage.ts` + `POST /api/media` validate type, size and
      require alt text, but nothing has been uploaded through them yet.

**The one visual deviation from DESIGN_SYSTEM.md.** White text on the
specified terracotta `#e4572e` measures **3.68:1**, below the 4.5:1 WCAG AA
requires. Rule 8 of the design system ("accessible = better looking, WCAG AA")
outranks the exact hex, so filled Donate buttons use `--terracotta-deep`
`#c9481f` (4.74:1). The original token is unchanged and still used for accents,
where it carries no text. Every other token pair passes: white-on-navy 13.1:1,
ink-on-cream 13.5:1, teal-on-cream 5.3:1, muted-on-cream 4.5:1.

**Public visibility has exactly one definition** — `publicFilter()` in
`lib/activities.ts` (published, not soft-deleted, publish date reached). Every
public query composes it; none filter by hand. That is what makes the gate hold
rather than depending on each page remembering.

Public content pages are `force-dynamic`: an Admin who approves a story expects
it live at once, and a prerendered build would need database access wherever
`next build` runs.

- **✅ Gate PASSED:** verified end to end with a real Editor session. While
  `draft` and again while `in_review`, the story returned **404** on its own
  URL and was absent from /programs, the home page and sitemap.xml. The Editor
  calling `POST /api/activities/{id}/publish` got **403** and the row stayed
  `draft`. Only after an Admin approved did all four surfaces show it.

### Phase 3 — Donations (bank transfer)
- [ ] Donations schema; Settings holds the bank details.
- [ ] Public Donate page: bank details + optional pledge form (creates `pending`, optional proof upload).
- [ ] Emails: donor acknowledgement ("pending confirmation") + Admin alert.
- [ ] Admin: list pending, **Confirm/Reject** (writes audit), and "+ Add donation" (offline).
- **✅ Gate:** a public pledge stays `pending` until an Admin confirms; reports count only `confirmed`.

### Phase 4 — Admin & Reports
- [ ] Dashboard metrics; approval queue; contact inbox (new/handled).
- [ ] Users management (Admin): invite, role, deactivate (reassign that user's drafts to another Admin on deactivate).
- [ ] Reports: date/category/status filter + confirmed totals + CSV export.
- [ ] Audit log write on sensitive actions + read-only viewer.
- [ ] Settings: org details, bank details, categories.
- **✅ Gate:** every donation confirm/reject and role change appears in the audit log; an Admin can export a CSV.

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
2. **First Admin email** — for the seed script.
3. **Bank details** to show on the Donate page: account name, account number/IBAN, bank name, and what reference donors should quote.
4. ~~**DB choice**~~ — **decided 15 Aug 2026: PostgreSQL on Supabase.**
5. **Auth** — Auth.js (in-app roles) or Clerk (hosted auth)?
6. Verified sending domain + "from" email for acknowledgements.
7. Real privacy policy / terms text and logo/brand assets.
