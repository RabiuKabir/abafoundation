# Foundation Web App — Design System

Give this file to Claude Code alongside AGENT_BUILD_SPEC.md. Tell it:
**"All UI must follow DESIGN_SYSTEM.md. Build these tokens and base components FIRST, then reuse them on every page. Never invent new colors, fonts, or spacing."**

The reason AI UIs look generic is that the agent restyles every page from scratch. This file locks the look so every screen is consistent — which is what reads as "designed by a human."

---

## Design direction
Warm, trustworthy, editorial — a storytelling NGO, not a SaaS dashboard. Think a good nonprofit magazine: a cream page (not stark white), a serif for headlines, lots of whitespace, real photography, and one warm call-to-action color for "Donate."

**References to match the feel** (tell the agent to aim for this vibe): charity: water, GiveDirectly, and the editorial calm of Linear's marketing site. Warm + generous + confident.

---

## Tokens (put these in `tailwind.config` + CSS variables)

**Fonts** (Google Fonts)
- Display / headings: **Fraunces** (serif, optical size on) — gives an editorial, human feel.
- Body / UI: **Inter** (clean, neutral).
- Rule: headings Fraunces, everything else Inter. Never more than these two.

**Color**
```
--ink        #1A2B3B   /* primary text */
--navy       #16324F   /* primary brand, headers, admin sidebar */
--teal       #2E6E8E   /* links, secondary buttons, accents */
--terracotta #E4572E   /* the ONE warm CTA color — "Donate" only */
--cream      #FBF7F0   /* page background (not #fff) */
--surface    #FFFFFF   /* cards on cream */
--muted      #6B7280   /* secondary text */
--border     #EAE3D8   /* warm hairline borders */
--success    #2F7D5D   --warning #8A6D1A   --danger #9B2C2C
```
Dark admin sidebar: `#12283E`. Keep the public site on cream, the admin content area on a very light warm gray `#F6F2EB`.

**Spacing** — 4px base. Be generous: section vertical padding 96–128px desktop / 56px mobile. Cards padded 24–32px. Don't crowd.

**Radius** — cards/inputs `14px`, buttons `10px`, pills `999px`. Slightly round = friendly.

**Shadow** — soft and low only: `0 1px 2px rgba(16,24,40,.04), 0 8px 24px rgba(16,24,40,.06)`. No hard drop shadows.

**Motion** — 150–200ms ease on hover/focus. Buttons lift 1px on hover. Respect `prefers-reduced-motion`.

---

## Components to build first (once), then reuse everywhere
Base on **shadcn/ui**, then retheme with the tokens above (this alone removes the generic look).
- `Button` — variants: primary (navy), donate (terracotta), outline, ghost. Visible focus ring, hover lift.
- `Input`, `Textarea`, `Select` — labeled, clear focus, inline error text.
- `Card` — white on cream, 14px radius, soft shadow, generous padding.
- `Badge` — status pills (draft/in-review/published/refunded etc.).
- `Nav` (public) and `Sidebar` (admin shell).
- `Container` — max-width ~1100px, comfortable gutters.
- `EmptyState` — friendly illustration/message for empty tables.

---

## Rules that make it look human (not AI)
1. **Real photography, not gray boxes.** Use real images (Unsplash for placeholders during build). Grey placeholder rectangles are the #1 AI tell.
2. **Real copy, not lorem ipsum.** Write actual headlines and story text, even rough.
3. **Consistency over novelty.** Same button, same card, same spacing on every page. Reuse components — never restyle per page.
4. **Whitespace is the design.** When unsure, add more space, not more elements.
5. **One accent.** Terracotta is *only* for Donate. Everything else is navy/teal/neutral.
6. **Type hierarchy.** Big Fraunces headline, calm Inter body, clear size jumps. Don't bold everything.
7. **Real states.** Design hover, focus, loading, empty, and error states — polished states read as hand-made.
8. **Accessible = better looking.** Good contrast, labels, focus rings. WCAG AA.

---

## How to work on UI with Claude Code (so it ends up looking designed)
1. Build tokens + base components first. Then build **the Home page only** to a high polish.
2. Ask Claude Code to **screenshot the page and critique it against this file**, then iterate 2–3 times until it looks hand-made. (Cheap and fast.)
3. Once Home looks right, tell it: **"This is our design language. Reuse these exact components and styles for every other page."**
4. For each new page, paste the matching mockup from `build_guide.html` as the layout reference, and say "style it with our design system."
5. If a page looks off, don't accept it — screenshot, point at what's wrong ("headline too small, cards too tight, wrong accent"), iterate.

> Fast path to a human look: start from a real, human-made template (a Tailwind UI / shadcn theme, or a nonprofit template) and customize it with these tokens — customizing good design beats generating from zero.
