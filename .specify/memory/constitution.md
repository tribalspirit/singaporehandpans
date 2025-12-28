# /speckit.constitution — SG Handpan Studio Site

## Purpose
Build a production-ready, SEO-friendly marketing site for a Handpan Music Studio using Astro SSG and Storyblok, with minimal client-side JavaScript. The site must be fast, accessible, mobile-first, and easy for non-technical users to update.

## Scope and information architecture
- Routes are pre-rendered static HTML (SSG) for SEO and performance.
- Required routes: `/`, `/about`, `/workshops`, `/events`, `/gallery`, `/contacts`.
- Events detail pages are generated from Storyblok slugs: `/events/[slug]`.
- The interactive **Handpan Memorization Widget** is part of the **Academy** section (already implemented as a placeholder). It must be implemented as a React island within Academy and must not force client-side rendering for the rest of the route.

## Non-goals
- No custom backend API.
- No user accounts.
- No payments.

## Principles (must-haves)

### 1) Mobile-first responsiveness
- Design and implement **small screens first**, progressively enhancing for larger viewports.
- Must be completely responsive and pass Lighthouse mobile checks (layout stability, tap targets, viewport handling).
- Use fluid typography and spacing (`clamp()`), modern CSS layout (grid/flex), and avoid fixed-size assumptions.

### 2) Accessibility by default
- Use semantic HTML for structure (landmarks, headings, lists, forms).
- Full keyboard navigation for all interactive UI.
- Provide ARIA labels/roles only where necessary; avoid ARIA as a substitute for semantics.
- Maintain sufficient contrast, focus outlines, and accessible states (hover/focus/disabled).
- Images require meaningful alt text or explicit decorative treatment.

### 3) Performance-first delivery
- Output must be SSG with prebuilt HTML for every route.
- **Minimal client JS**: use **Astro islands only** for interactive components (e.g., gallery filter/lightbox, carousels, Calendly embed, Academy widget).
- Prefer lighter libraries and avoid heavy dependencies unless there is a clear, measured benefit.
- Defer non-critical JS, hydrate islands strategically (`client:visible` / `client:idle`), and avoid layout shifts.

### 4) SEO as a baseline feature
- Every route must ship pre-rendered HTML with:
  - Unique `<title>` and meta description
  - Canonical URL
  - OpenGraph + Twitter card metadata
- Generate `sitemap.xml` and `robots.txt`.
- Where applicable: JSON-LD for Organization/LocalBusiness and Events.

### 5) Styling system: SCSS + CSS Modules
- No Tailwind. Use **SCSS + CSS Modules** for component styling.
- Define global design tokens via CSS variables:
  - colors, spacing, typography, radii, shadows
- Keep a small global base stylesheet; component styles remain local.
- Theme tokens live in a dedicated file (e.g., `src/styles/tokens.scss`) and are used consistently.

### 6) Content is owned by Storyblok
- All Events + Gallery + Workshops (and related marketing content) must come from Storyblok.
- No hardcoded content except safe fallbacks / empty states when CMS is unreachable.
- Content fetching happens at build-time via Storyblok Delivery API.
- The site must fail gracefully if CMS is unavailable (friendly message, empty lists, no broken build if possible).

### 7) Code quality and maintainability
- TypeScript **strict** is mandatory.
- ESLint + Prettier enforced with consistent formatting and lint rules.
- Deterministic builds (lockfile committed, repeatable CI).
- Clear folder structure and module boundaries.
- All environment variables are documented (README), with example `.env` template and validation where appropriate.

### 8) Testing & basic quality gates
- At minimum: smoke tests verifying build output and key routes exist in `dist`.
- Add a lightweight link checker if feasible (internal links + critical external links).
- CI should run lint + typecheck + tests on every PR.

## Widget-specific constitutional constraints (Academy)
- The Academy Handpan Memorization Widget must:
  - Be implemented as a **React island** (not global SPA).
  - Be responsive, accessible, and performant under the same standards as the rest of the site.
  - Avoid prerecording sequences; generate playback dynamically (Tone.js synth-first; sampler optional later).
  - Be data-driven: adding a new handpan type/scale should be primarily a config change, not bespoke UI code.

## Definition of Done (global)
- All pages render as prebuilt HTML and meet SEO requirements.
- Lighthouse mobile metrics are acceptable; interactions feel snappy on real devices.
- Accessibility checks pass for keyboard navigation and basic screen reader semantics.
- Content is editable in Storyblok with fallbacks.
- CI gates: lint + typecheck + build + smoke tests pass.
