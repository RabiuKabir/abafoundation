# ABA Foundation

Public site + admin for a foundation that receives donations **by bank
transfer**. Built to `AGENT_BUILD_SPEC.md` and `DESIGN_SYSTEM.md`.

**Status: Phase 0 (setup skeleton).** No auth, no features yet.

## Stack

Next.js 16 (App Router, RSC) · TypeScript · Tailwind CSS v4 · shadcn/ui ·
Drizzle ORM + drizzle-kit · PostgreSQL (Supabase).

## Run it locally

```bash
npm install
cp .env.example .env        # then fill DATABASE_URL + DIRECT_URL
npm run dev                 # http://localhost:3000
```

- Public home: <http://localhost:3000/>
- Admin shell: <http://localhost:3000/dashboard>

## Database — PostgreSQL on Supabase

Two connection strings, both from Supabase → Project Settings → Database:

- `DATABASE_URL` — **transaction pooler**, port 6543. The app's runtime
  connection. Required on serverless; prepared statements are disabled for it
  in [lib/db.ts](lib/db.ts).
- `DIRECT_URL` — **direct/session**, port 5432. Migrations and the seed script
  only, because DDL needs a real session.

```bash
npm run db:generate   # schema → SQL migration (already generated for Phase 0)
npm run db:migrate    # apply migrations over DIRECT_URL
npm run db:seed       # one Admin from SEED_ADMIN_* + demo settings
npm run db:studio     # browse the data
```

We use Supabase as Postgres (and later Storage) only — **not** Supabase Auth,
and **not** RLS. Auth.js owns identity; `can(user, action)` on the server owns
authorization.

### If database commands hang

On some networks (corporate WiFi, a few ISPs) a transparent HTTP proxy accepts
every outbound connection but only forwards HTTP. Postgres speaks a binary
protocol, so it hangs forever instead of failing — the symptom is
`npm run db:migrate` sitting at `applying migrations…`.

Diagnose in one line: if `curl` works but a Postgres connect never returns, and
sending non-HTTP bytes to *any* host on port 5432 also hangs, that's it.

Workaround — these proxies honour HTTP `CONNECT`:

```bash
npm run db:tunnel                     # terminal 1: prints a 127.0.0.1 URL
DIRECT_URL="<printed url>" npm run db:migrate    # terminal 2
DIRECT_URL="<printed url>" npm run db:seed
```

[scripts/pg-tunnel.mjs](scripts/pg-tunnel.mjs) tunnels a local port to the
database through the proxy. Delete it if you're never on such a network.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Design system

`DESIGN_SYSTEM.md` is the contract. The tokens live in
[app/globals.css](app/globals.css) (`:root` + Tailwind v4 `@theme`) — colours,
radius, shadows, motion and the two fonts (Fraunces for headings, Inter for
everything else).

Build pages from the components in [components/ui/](components/ui/) —
`Button`, `Input`, `Textarea`, `Select`, `Card`, `Badge`, `Field`,
`Container`/`Section`, `EmptyState` — plus
[components/public/](components/public/) and
[components/admin/](components/admin/). **Never restyle per page, and never
introduce a colour that isn't a token.** Terracotta is reserved for Donate.

## Hard rules (from the spec)

1. Donations submitted by the public are always `pending`. Only an **Admin**
   moves one to `confirmed`, after checking the bank statement. Reports count
   `confirmed` only.
2. Authorization is enforced **on the server** in every API route via
   `can(user, action)`. The UI only hides what the server already forbids.
   Deny by default.
3. Validate every input on the server with zod. Use the ORM — no hand-built
   SQL.
4. No secrets in the repo. Everything through `.env`.
5. PostgreSQL (Supabase) with Drizzle ORM.
