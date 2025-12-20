# Handpan Studio SpecKit + Cursor Ruleset

**Version:** 1.1.0

## Description

Unified ruleset for GitHub Spec Kit (spec/plan/tasks-driven development) + Cursor (implementation assistant) for an Astro + React islands static site using Storyblok, SCSS modules, strict SEO, and mobile-first responsive design.

## Core Principles

1. **Spec-first development:** Always align code changes to Spec Kit artifacts (constitution/spec/plan/tasks)
2. **Ship SEO-first static HTML** with minimal client JavaScript (islands only)
3. **Mobile-first, accessible, maintainable code** with predictable builds

---

## Diff Rules

**No comments in diffs** (strict enforcement)

Do not add comments of any kind in changed lines. Explanations must be expressed through naming, structure, or external documentation only when explicitly requested.

### Forbidden Comment Syntax

- `//`
- `/*` and `*/`
- `<!--` and `-->`
- `/**` and `*/`
- `TODO`
- `FIXME`
- `@ts-ignore`
- `@ts-expect-error`

### Scope

All files and changes.

### Exceptions

- **User request:** Not allowed even when explicitly requested
- **Generated files:** Allowed in generated files only

---

## SpecKit Integration

### Mode

**Spec-first development**

### Workflow

1. `speckit.constitution`
2. `speckit.specify`
3. `speckit.plan`
4. `speckit.tasks`
5. `speckit.implement`

### Authority Order

1. `spec/constitution.md`
2. `spec/spec.md`
3. `spec/plan.md`
4. `spec/tasks.md`
5. Code

### Rules

- If implementation choices are ambiguous, prefer the plan; if the plan is missing detail, extend plan/spec before coding
- Do not implement features that are not present in spec/tasks unless explicitly instructed; instead propose updating spec/tasks
- Whenever code changes introduce new behavior, ensure the spec and tasks remain accurate and up to date
- Treat the constitution as non-negotiable; if a request conflicts, propose a spec change rather than silently violating principles

### Artifact Locations

| Artifact | Path |
|----------|------|
| Constitution | `spec/constitution.md` |
| Spec | `spec/spec.md` |
| Plan | `spec/plan.md` |
| Tasks | `spec/tasks.md` |
| Decisions Log | `spec/decisions.md` |
| Notes | `spec/notes.md` |

### Change Protocol

#### When to Update Spec

- Any new page/route or content model change
- Any new dependency that affects architecture/performance
- Any new integration step (e.g., Storyblok, deployment, webhooks)
- Any change that impacts SEO, accessibility, or responsiveness guarantees

#### When to Update Plan

- Folder structure changes
- Data fetching strategy changes (build-time vs runtime)
- Rendering strategy changes (SSG/SSR/partial hydration)
- Testing strategy changes

#### When to Update Tasks

- Task decomposition changes
- Task ordering changes
- New acceptance criteria added or removed

---

## Cursor Role & Behavior

### Role

**Implementer**

### Behavior Rules

1. Before coding, identify the relevant spec/tasks section(s) and implement only what is requested
2. Prefer small, focused diffs. Do not reformat unrelated files
3. Provide outputs as: changed files list, concise summary, and env var notes
4. Never add comments in changed lines (strict)

### Output Expectations

- ✅ List changed files
- ✅ Concise summary
- ✅ Document new env vars
- ❌ Avoid verbose narration

### Safety Rails

- ✅ No background promises
- ✅ No assumptions about external secrets
- ✅ No network calls at runtime for SSG content unless in plan

---

## Stack

| Component | Technology |
|-----------|------------|
| Framework | Astro |
| Rendering | Static SSG |
| UI | React Islands |
| Language | TypeScript (strict) |
| Styling | SCSS + CSS Modules |
| CMS | Storyblok |

---

## Architecture

### Directory Structure

| Purpose | Path |
|---------|------|
| Pages | `src/pages/*.astro` |
| Layouts | `src/layouts` |
| Astro Components | `src/components` |
| React Islands | `src/components/islands` |
| CMS Client | `src/lib/storyblok` |
| Design Tokens | `src/styles/tokens.scss` |
| Global Styles | `src/styles/global.scss` |

### Content Policy

All dynamic content must originate from Storyblok with safe fallbacks only. Avoid hardcoding production copy in components.

### Routing Policy

**Static Routes:**
- `/`
- `/about`
- `/workshops`
- `/events`
- `/gallery`
- `/contacts`

**Dynamic Routes:**
- `/events/[slug]`

---

## SEO Requirements

### Required Features

- ✅ HTML pre-rendering
- ✅ Per-page meta tags
- ✅ Canonical URLs
- ✅ Open Graph tags
- ✅ Twitter Card tags
- ✅ Sitemap
- ✅ robots.txt

### JSON-LD Schema Types

- Organization
- LocalBusiness
- Event

### Rules

- All routes must render meaningful HTML at build time (no blank shell)
- Event detail pages must be indexable and pre-rendered
- Avoid duplicating titles/descriptions across pages

---

## Performance

### Requirements

- ✅ Avoid global JS
- ✅ Islands only for interactivity
- ✅ Prefer CSS animations
- ✅ Image optimization required

### Rules

- Do not hydrate React islands unless strictly necessary
- Keep third-party scripts scoped (e.g., Calendly only on relevant pages/islands)

---

## Responsiveness

### Strategy

**Mobile-first design**

### Target Specifications

- **Min width:** 360px
- **Touch-friendly:** Yes
- **Keyboard navigable:** Yes

### Acceptance Criteria

- Navigation works on small screens with an accessible menu
- Layouts adapt cleanly across mobile/tablet/desktop without horizontal scrolling
- Tap targets are adequate and not cramped

---

## Accessibility

### Requirements

- ✅ Semantic HTML
- ✅ ARIA where needed
- ✅ Focus styles required
- ✅ Sufficient contrast

### Rules

- Use buttons for actions and links for navigation
- Never remove focus outlines without providing an accessible alternative

---

## Styling

### Policy

- ❌ No Tailwind
- ❌ No CSS-in-JS
- ✅ Design tokens via CSS variables
- ✅ Max nesting depth: 3

### Preferred Techniques

- `clamp()` for responsive sizing
- CSS logical properties

### Global CSS Limit

Tokens and reset only

---

## TypeScript

### Strict Mode Requirements

- ✅ `noImplicitAny`
- ✅ Prefer `unknown` over `any`
- ✅ Explicit types for CMS models
- ✅ `strictNullChecks`

### Rules

- No untyped Storyblok payload usage; define model types and narrow safely
- Avoid suppressions; fix types instead

---

## CMS (Storyblok)

### Configuration

| Setting | Value |
|---------|-------|
| Provider | Storyblok |
| Integration | `@storyblok/astro` |
| Fetch Phase | Build-time |
| Typed Models | Required |
| Graceful Degradation | Yes |

### Content Models

#### Event Item
- title
- startDateTime
- endDateTime
- location
- descriptionRichText
- coverImage
- bookingUrl
- status
- slug

#### Gallery Item
- image
- alt
- caption
- tags
- sortOrder

### Rules

- All Storyblok access goes through a single client module under `src/lib/storyblok`
- If CMS data is missing, show a clean empty state and keep SEO meta intact

---

## Calendly Integration

### Requirements

- ✅ Encapsulated island
- ✅ Fallback link required

### Rules

- Calendly embed must be isolated to its component and only loaded where used
- Provide a visible link to open booking in a new tab

---

## Testing

### Requirements

- ✅ Build must pass
- ✅ Route smoke tests

### Rules

- At minimum, verify the build output includes expected routes in `dist` and pages render without runtime JS errors
- Keep tests lightweight and aligned with static output constraints

---

## Documentation

### Requirements

- ✅ README required
- ❌ No inline comments instead of docs

### Must Document

- Local dev commands
- Build/deploy commands
- Required environment variables
- Storyblok space setup and webhook rebuild notes

