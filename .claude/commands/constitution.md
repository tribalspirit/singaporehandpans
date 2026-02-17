---
name: constitution
description: Core project principles and architectural constraints for SG Handpan Studio. Reference before making architectural decisions or adding new features.
---

# Project Constitution

Build a production-ready, SEO-friendly marketing site for a Handpan Music Studio using Astro SSG and Storyblok, with minimal client-side JavaScript.

## Scope & Routes

- **SSG**: All routes pre-rendered as static HTML
- **Routes**: `/`, `/about`, `/workshops`, `/events`, `/gallery`, `/contacts`, `/shop`, `/academy`
- **Dynamic**: `/events/[slug]` from Storyblok slugs
- **Academy Widget**: React island within Academy page (not global SPA)

## Non-Goals

- No custom backend API
- No user accounts
- No payments (Shop links to external Shopify checkout)

## Core Principles

### 1. Mobile-First Responsiveness

- Design small screens first, enhance for larger
- Fluid typography with `clamp()`
- Modern CSS layout (grid/flex)
- Pass Lighthouse mobile checks

### 2. Accessibility by Default

- Semantic HTML (landmarks, headings, lists, forms)
- Full keyboard navigation
- ARIA only where necessary
- Sufficient contrast, focus outlines
- Meaningful alt text for images

### 3. Performance-First Delivery

- SSG with prebuilt HTML for every route
- **Astro islands only** for interactive components
- Hydrate strategically (`client:visible` / `client:idle`)
- Defer non-critical JS, avoid layout shifts
- Prefer lighter libraries

### 4. SEO Baseline

- Unique `<title>` and meta description per route
- Canonical URLs
- OpenGraph + Twitter cards
- `sitemap.xml` and `robots.txt`
- JSON-LD for Organization/Events

### 5. Styling: SCSS + CSS Modules

- **No Tailwind**
- Global tokens in `src/styles/tokens.scss`
- Component styles via CSS Modules
- Design tokens: colors, spacing, typography, radii, shadows

### 6. Content Owned by Storyblok

- All Events, Gallery, Workshops from CMS
- No hardcoded content (except fallbacks)
- Build-time fetching via Storyblok Delivery API
- Graceful fallback if CMS unavailable

### 7. Code Quality

- TypeScript **strict** mandatory
- ESLint + Prettier enforced
- Deterministic builds (lockfile committed)
- Environment variables documented

### 8. Testing & Quality Gates

- Smoke tests for build output and key routes
- Link checker for internal/critical external links
- CI runs: lint + typecheck + tests on every PR

## Widget Constraints (Academy)

The Handpan Memorization Widget must:

- Be a **React island** (not global SPA)
- Be responsive, accessible, performant
- Generate playback dynamically (Tone.js synth)
- Be **data-driven**: new handpan type = config change only

## Definition of Done

- [ ] All pages render as prebuilt HTML
- [ ] SEO requirements met (title, meta, canonical)
- [ ] Lighthouse mobile metrics acceptable
- [ ] Keyboard navigation works
- [ ] Content editable in Storyblok
- [ ] CI gates pass (lint, typecheck, build, tests)

## Related Skills

- `/setup` - Development environment
- `/storyblok` - CMS content management
- `/deploy` - Cloudflare deployment

## Source Documentation

- `.specify/memory/constitution.md`
