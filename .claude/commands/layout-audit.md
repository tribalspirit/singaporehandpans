---
name: layout-audit
description: Multi-agent layout audit. Phase 1 (Designer) audits UI across viewports with Playwright. Phase 2 (Developer) fixes all issues preserving SCSS conventions.
---

# Layout Audit — Multi-Agent Skill

Two-phase layout audit and fix workflow for SG Handpan Studio.

- **Phase 1 (Designer Agent):** Automated + interactive Playwright audit across 8 viewports and all pages. Produces a structured issue report.
- **Phase 2 (Developer Agent):** Reads the report, fixes all issues following project conventions, and verifies the fixes.

## Arguments

`$ARGUMENTS` supports:

| Flag | Effect |
|------|--------|
| *(none)* | Run both phases end-to-end |
| `--audit-only` | Run Phase 1 only — produce report |
| `--fix-only` | Run Phase 2 only — fix from existing report |
| `--pages home,about` | Limit to specific pages |
| `--critical-only` | Phase 2 fixes only critical-severity issues |

---

## Prerequisites

1. Check `/constitution` constraints before starting
2. Ensure dev server is running:
   ```bash
   # check if already running
   curl -s -o /dev/null -w "%{http_code}" http://localhost:4321 || npm run dev &
   ```
3. Ensure Playwright browsers are installed:
   ```bash
   npx playwright install chromium
   ```

---

## Phase 1: Designer Agent

### Step 1 — Run automated audit script

```bash
npm run audit
# or with filters:
npm run audit -- --pages home,about --viewports mobile-portrait,desktop
```

This runs `scripts/layout-audit.ts` which:
- Visits every page at 8 viewports (mobile portrait/landscape, tablet portrait/landscape, small/regular/wide desktop)
- Captures full-page screenshots to `audit-reports/screenshots/`
- Runs DOM-level checks: touch targets, contrast, overflow, spacing, image containment, typography, clipping
- Writes `audit-reports/layout-audit-latest.json` and `audit-reports/layout-audit-latest.md`

### Step 2 — Interactive Playwright MCP follow-up

The automated script catches measurable issues. Use the **Playwright MCP** for visual issues the script cannot detect:

1. Open each page at mobile (375px), tablet (768px), and desktop (1440px) viewports
2. **Specifically check:**
   - Hero section: are buttons clearly visible against all carousel slide backgrounds?
   - Navigation: does the hamburger menu open/close properly on mobile?
   - Carousel controls: are prev/next buttons and dots adequately sized?
   - Footer: does layout hold at all breakpoints?
   - Cards/grids: do items wrap correctly without orphaned single items?
   - Forms: are inputs and labels properly sized on mobile?
   - Modals/overlays: do they fit within the viewport?
3. Note any **alignment**, **visual hierarchy**, or **aesthetic** issues the script missed

### Step 3 — Consolidate and prioritize

Use **sequential-thinking** MCP to:
1. Merge automated results with manual findings
2. Deduplicate similar issues across viewports
3. Assign final severity:
   - **Critical:** Broken layout, invisible/inaccessible buttons, horizontal overflow, clipped controls
   - **Warning:** Suboptimal spacing, undersized touch targets, minor contrast issues
   - **Info:** Aesthetic improvements, consistency suggestions
4. Update `audit-reports/layout-audit-latest.md` with the consolidated report

---

## Phase 2: Developer Agent

### Step 1 — Read and plan

1. Read the audit report: `audit-reports/layout-audit-latest.md`
2. Use **sequential-thinking** to plan fix strategy:
   - Group issues by source file (which SCSS module or Astro component)
   - Identify co-located fixes (issues in the same CSS block)
   - Prioritize: critical → warning → info
   - Separate style-only fixes from component-level changes

### Step 2 — Apply fixes

Use **serena** MCP to explore and edit code. Use **context7** for any Astro/CSS API questions.

**Constraints (from `/constitution`):**
- Use design tokens from `src/styles/tokens.scss` — **never hardcode** color, spacing, or font values
- SCSS Modules (`.module.scss`) for React components, scoped `<style lang="scss">` for Astro pages
- **No Tailwind**
- Mobile-first media queries with existing breakpoints: 640 / 768 / 1024 / 1280 / 1536
- Preserve existing BEM naming convention

**Common fix patterns:**

| Issue | Fix pattern |
|-------|-------------|
| Touch target too small | `min-width: 44px; min-height: 44px;` on mobile interactive elements |
| Button invisible on hero | Add `text-shadow: 0 1px 4px rgba(0,0,0,0.5);` and/or increase overlay opacity. For outline buttons on dark backgrounds, use `border-color: var(--color-white); color: var(--color-white);` |
| Horizontal overflow | `overflow-x: hidden` on section wrapper; `min-width: 0` on flex/grid children |
| Padding too small | Use `var(--space-4)` minimum on mobile containers |
| Text too small | Use `var(--font-size-sm)` minimum (14px) |
| Asymmetric padding | Ensure `padding-left` and `padding-right` use same token |
| Image overflow | `max-width: 100%; height: auto;` or `object-fit: cover` |

### Step 3 — Verify fixes

1. Re-run the automated audit:
   ```bash
   npm run audit
   ```
   Confirm critical issues drop to 0.
2. Use **Playwright MCP** to visually verify fixed pages at key viewports.
3. Run the build to confirm no breakage:
   ```bash
   npm run build
   ```
4. Run tests if any logic changes were made:
   ```bash
   npm test
   ```

---

## MCP Routing

| Task | MCP Tool |
|------|----------|
| Visual inspection, screenshots, DOM queries | **playwright** |
| Plan fix strategy, prioritize issues | **sequential-thinking** |
| Explore and edit code | **serena** |
| CSS/Astro API references | **context7** |
| Branch/PR management | **github** |

---

## Viewports tested

| Name | Size | Device type |
|------|------|-------------|
| mobile-portrait | 375×812 | iPhone SE/13 mini |
| mobile-portrait-14 | 390×844 | iPhone 14 |
| mobile-landscape | 812×375 | iPhone landscape |
| tablet-portrait | 768×1024 | iPad portrait |
| tablet-landscape | 1024×768 | iPad landscape |
| small-desktop | 1280×720 | Small laptop |
| desktop | 1440×900 | Standard desktop |
| wide-desktop | 1920×1080 | Full HD |

## Pages audited

`/` · `/about` · `/academy` · `/events` · `/gallery` · `/contacts` · `/shop` · `/privacy` · `/terms`

## Output files

| File | Purpose |
|------|---------|
| `audit-reports/layout-audit-latest.md` | Human-readable report |
| `audit-reports/layout-audit-latest.json` | Machine-readable issues |
| `audit-reports/screenshots/{viewport}/{page}.png` | Visual evidence |

$ARGUMENTS
