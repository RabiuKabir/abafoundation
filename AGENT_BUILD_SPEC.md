# Foundation Web App — Build Spec (for a coding agent)

**How to use this file:** put it in the repo root. Tell your coding agent:
*"Build this app by following AGENT_BUILD_SPEC.md. Do the phases in order. After each phase, stop and show me it meets the acceptance criteria before moving on."*

Keep changes small and phase-scoped. Do not skip the **Hard Rules**.

---

## Hard Rules (never break these)
1. **Donation status comes only from the Stripe webhook** — never from the browser/success page. Verify the webhook signature; make it idempotent on `providerPaymentId`.
2. **Authorization is enforced on the server** in every API route via `can(user, action)`. The UI only hides what the server already forbids. Deny by default.
3. **Validate every input** on the server (zod). Use the ORM (no hand-built SQL).
4. **No secrets in the repo.** Everything via `.env`.
5. **Database is MySQL 8+** (Prisma `provider = "mysql"`).

---

## Stack (decided — one choice each)
- **Framework:** Next.js (App Router) + TypeScript — serves public site, admin, and API in one project.
- **Styling:** Tailwind CSS (+ shadcn/ui for accessible components).
- **Database:** **MySQL 8+** via **Prisma ORM**. Use a managed MySQL (PlanetScale or any managed MySQL). 
- **Auth:** Auth.js (NextAuth) credentials provider; hashed passwords (argon2/bcrypt); role on the user. MFA (TOTP) for Owner/Admin — add just after launch.
- **Payments:** Stripe Checkout (hosted) + webhook.
- **Email:** Resend (receipts, invites, resets, contact alerts).
- **File storage:** S3-compatible (Cloudflare R2 or AWS S3), signed uploads (UploadThing is fine).
- **Hosting:** Vercel + managed MySQL. Deploy = `git push` (no CI/CD).
- **Safety net:** Sentry (errors) + managed daily backups.

> PlanetScale note: it doesn't use foreign-key constraints by default — set Prisma `relationMode = "prisma"` if you use it. On a plain managed MySQL, keep normal FK constraints.

---

## Environment variables (`.env`)
```
DATABASE_URL="mysql://user:pass@host:3306/ngo"
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
RESEND_API_KEY=...
EMAIL_FROM="Hope Foundation <hello@yourdomain.org>"
S3_BUCKET=...  S3_REGION=...  S3_ACCESS_KEY=...  S3_SECRET_KEY=...
SENTRY_DSN=...
```

---

## Roles & permissions (enforce server-side)
`C`reate `R`ead `U`pdate `D`elete `A`pprove/publish · `—` none

| Resource | Owner | Admin | Finance | Editor | Public |
|---|---|---|---|---|---|
| Content/activities | CRUD·A | CRUD·A | R | CRU own drafts + submit | R published |
| Media | CRUD | CRUD | — | C·R own | R |
| Online donations | R | R | R·U (refund) | — | own receipt |
| Offline donations | CRUD | R | CRUD | — | — |
| Reports/export | R | R | R | — | — |
| Contact messages | CRUD | CRUD | — | — | C (submit) |
| Users & roles | CRUD | — | — | — | — |
| Settings / keys | CRU (keys) | U (safe) | — | — | — |
| Audit log | R | R | R | — | — |

Implement one helper: `can(user, action)` in `lib/rbac.ts`. Every protected route calls it first.

---

## Data model (Prisma — MySQL)
```prisma
datasource db { provider = "mysql"; url = env("DATABASE_URL") }
generator client { provider = "prisma-client-js" }

enum Role       { owner admin finance editor }
enum ActStatus  { draft in_review published archived }
enum MediaType  { image video }
enum DonSource  { online offline }
enum DonStatus  { pending completed refunded failed }
enum MsgStatus  { new_ handled }

model User {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  passwordHash String
  role         Role     @default(editor)
  active       Boolean  @default(true)
  activities   Activity[]
  createdAt    DateTime @default(now())
}

model Invite {
  id        String   @id @default(cuid())
  email     String
  role      Role
  tokenHash String
  expiresAt DateTime
  acceptedAt DateTime?
}

model Category {
  id         String     @id @default(cuid())
  name       String
  slug       String     @unique
  activities Activity[]
}

model Activity {
  id             String     @id @default(cuid())
  title          String
  slug           String     @unique
  summary        String     @db.Text
  body           String     @db.Text
  status         ActStatus  @default(draft)
  categoryId     String
  category       Category   @relation(fields: [categoryId], references: [id])
  coverMediaId   String?
  authorId       String
  author         User       @relation(fields: [authorId], references: [id])
  publishedAt    DateTime?
  seoTitle       String?
  seoDescription String?    @db.Text
  media          Media[]
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
  deletedAt      DateTime?
}

model Media {
  id          String    @id @default(cuid())
  activityId  String?
  activity    Activity? @relation(fields: [activityId], references: [id])
  url         String
  type        MediaType @default(image)
  altText     String
  createdById String
  createdAt   DateTime  @default(now())
}

model Donation {
  id                String    @id @default(cuid())
  donorName         String?
  donorEmail        String?
  amount            Decimal   @db.Decimal(10,2)
  currency          String    @default("USD")
  fee               Decimal   @db.Decimal(10,2) @default(0)
  net               Decimal   @db.Decimal(10,2) @default(0)
  source            DonSource @default(online)
  provider          String?
  providerPaymentId String?   @unique       // idempotency + reconciliation
  status            DonStatus @default(pending)
  activityId        String?
  receiptNo         String?
  consentContact    Boolean   @default(false)
  createdAt         DateTime  @default(now())
}

model Contact {
  id        String    @id @default(cuid())
  name      String
  email     String
  message   String    @db.Text
  status    MsgStatus @default(new_)
  createdAt DateTime  @default(now())
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  action    String
  entity    String
  entityId  String?
  meta      Json?
  createdAt DateTime @default(now())
}

model Setting {
  key   String @id
  value Json
}
```

---

## Folder structure (Next.js App Router)
```
app/
  (public)/  page.tsx  about/  programs/  programs/[slug]/  donate/  donate/success/  contact/  privacy/  terms/
  (admin)/   layout.tsx  dashboard/  activities/  approvals/  donations/  reports/  messages/  users/  audit/  settings/
  login/     page.tsx
  api/
    auth/[...nextauth]/route.ts
    activities/route.ts            (+ [id]/route.ts, [id]/publish/route.ts)
    media/route.ts
    donations/route.ts             (create checkout session, offline entry)
    webhooks/stripe/route.ts       ← donation source of truth
    contact/route.ts
    users/route.ts
    reports/route.ts
components/  ui/  public/  admin/
lib/  db.ts  auth.ts  rbac.ts  stripe.ts  mail.ts  storage.ts  audit.ts  validation.ts
prisma/  schema.prisma  seed.ts
middleware.ts        ← protects /(admin)
.env
```

---

## Pages & key UI (minimalist: whitespace, one navy/teal accent, one font)
**Public**
- **Home** — hero + primary "Donate" CTA + 3 featured activities + footer.
- **About** — mission/history + team.
- **Programs** — category filter chips + card grid + pagination.
- **Activity detail** — category/date, cover image, story, media gallery, inline Donate CTA.
- **Donate** — preset tiers ($50/$100/$250/custom) + name + email + consent checkbox → Stripe.
- **Donate success** — shows server-confirmed status + "receipt emailed".
- **Contact** — name/email/message (honeypot + rate limit) + embedded map.
- **404/500** — friendly, one link home.

**Admin** (dark sidebar + light content shell; menu items shown per role)
- **Login** — email/password + forgot-password link.
- **Dashboard** — KPI row (raised 30d, donations, pending review, new messages) + recent donations table.
- **Activities** — table with status badges; Editors see only their drafts.
- **Activity editor** — title, category, date, cover upload (with alt text), body, collapsible SEO; Save draft / Submit.
- **Approvals** — queue of submitted drafts; Approve & publish / Return with note.
- **Donations** — filter by source/status; "+ Offline entry"; refund action (Finance).
- **Reports** — date/category filter, gross/fees/net tiles, breakdown, Export CSV.
- **Messages** — contact inbox with new/handled status.
- **Users** — Owner only: invite, assign role, deactivate.
- **Settings** — org details + categories (Admin); integration keys (Owner only).
- **Audit log** — read-only trail of sensitive actions.

*(Visual reference: see the delivered `build_guide.html` mockups — same layouts.)*

---

## Build tasks (do in order; stop at each ✅ gate)

### Phase 0 — Setup
- [ ] Scaffold Next.js + TS + Tailwind; add shadcn/ui.
- [ ] Add Prisma, set MySQL datasource, create schema above, run first migration.
- [ ] Base layout, design tokens, shared UI primitives.
- [ ] Deploy to Vercel; set env vars.
- **✅ Gate:** app deploys to a live URL and `prisma migrate` runs clean on MySQL.

### Phase 1 — Auth & RBAC
- [ ] User model + Auth.js credentials login; hash passwords.
- [ ] Invite flow (Owner invites → email link → set password → verify).
- [ ] Password reset (no account enumeration, expiring single-use token).
- [ ] `lib/rbac.ts` `can()` + `middleware.ts` guarding `(admin)`.
- **✅ Gate:** a non-Owner is rejected **by the server** from a users-only route (not just a hidden menu).

### Phase 2 — Content & Public Site
- [ ] Activity + Category + Media models wired; media upload (validate type/size, require alt text).
- [ ] Activity CRUD with `draft → in_review → published → archived`.
- [ ] Public pages: Home, About, Programs (filter + pagination), Activity detail, Contact (honeypot + rate limit).
- [ ] SEO fields, sitemap.xml, robots.txt, 404/500. Accessibility pass (keyboard, contrast, labels, alt text).
- **✅ Gate:** an Editor's draft cannot appear publicly until an Admin approves it.

### Phase 3 — Donations
- [ ] Donation model; `POST` create Stripe Checkout session.
- [ ] `api/webhooks/stripe` — verify signature, idempotent on `providerPaymentId`, set status.
- [ ] Receipt email (Resend); success page reads server-confirmed status.
- [ ] Finance offline-donation entry form.
- **✅ Gate:** closing the browser before the success page still records the donation correctly, and a receipt is sent.

### Phase 4 — Admin & Reports
- [ ] Dashboard metrics; approval queue; contact inbox (new/handled).
- [ ] Users management (Owner): invite, role, deactivate (reassign that user's drafts to Admin on deactivate).
- [ ] Reports: date/category/status filter + gross/fees/net + CSV export.
- [ ] Audit log write on sensitive actions + read-only viewer.
- [ ] Settings: org details, categories, keys (Owner only).
- **✅ Gate:** every donation edit/refund and role change appears in the audit log; Finance can export a CSV.

### Phase 5 — Security, Polish & Launch
- [ ] Server-side validation everywhere; rate limits on auth/contact; secure headers + CORS.
- [ ] Accessibility + mobile pass; wire Sentry.
- [ ] Confirm managed backups on; run **one real restore drill**.
- [ ] Connect domain + TLS; manual UAT with real staff.
- **✅ Gate:** restore-from-backup succeeds; no high/critical security or accessibility issue open.

---

## Deferred (do NOT build now)
CI/CD pipelines, Redis, containers/K8s, APM suites, recurring giving, newsletter, events/RSVP, second payment gateway, public donor accounts. All can be added later without rework.

---

## Decisions needed from the product owner (agent: ask if unset)
1. Currency + Stripe payout country.
2. One-off donations only at launch? (recurring is deferred by default)
3. English only, or multilingual public site?
4. Confirm four roles (Owner/Admin/Finance/Editor) — or merge Finance into Admin?
5. Verified sending domain + "from" email for receipts.
6. Real privacy policy / terms text and logo/brand assets.
7. How the first Owner account is created (seed script) — provide their email.
