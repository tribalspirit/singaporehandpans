Always use:

- **serena** — semantic code retrieval and editing (read symbols, find references, replace bodies)
- **context7** — up-to-date docs for third-party libraries (Astro, React, Storyblok, TonalJS, Tone.js, Embla, Vitest)
- **sequential-thinking** — any decision making, architecture planning, or multi-step reasoning
- **playwright** — run the app in a browser, inspect UI, debug visual issues, run E2E checks
- **pkg-versions** — check for package updates or version conflicts in package.json
- **github** — open PRs, review issues, manage branches for the `tribalspirit/singaporehandpans` repo
- **sentry** — investigate runtime errors or production incidents
- **cloudflare-docs** — Cloudflare Pages deployment, Workers, R2, routing, and adapter config questions

## Project: Singapore Handpan Studio (`sghandpan`)

**Stack:** Astro 4 (hybrid SSR) · React 18 islands · TypeScript 5 · SCSS + CSS Modules · Vitest · Cloudflare Pages

**Integrations:** Storyblok CMS · Shopify Storefront API · Acuity Scheduling · GA4/GTM

**Key source dirs:** `src/pages/` · `src/components/` · `src/widgets/` · `src/lib/` · `src/styles/`

## Skill routing — invoke the matching skill FIRST before writing any code

| Task domain | Skill to invoke |
| --- | --- |
| Architecture decision or new feature | `/constitution` — check constraints before starting |
| Storyblok CMS (content, components, schemas) | `/storyblok` |
| Shopify / shop page | `/shop` |
| Gallery (lightbox, tag filters, album) | `/gallery` |
| Academy handpan memorization widget | `/handpan-widget` |
| Music theory, scales, intervals, handpan pedagogy | `/music-theory` |
| Cloudflare Pages deploy, env vars, build issues | `/deploy` + **cloudflare-docs** MCP |
| Dev environment, local setup, tokens | `/setup` |
| Find or add a new MCP / skill | `/smithery-ai-cli` |
| Layout audit, responsive issues, UI bugs | `/layout-audit` |
| Code quality review after changes | `/simplify` |

## Workflow

1. Read the task — identify the domain(s) above
2. Invoke the matching skill(s) for domain context
3. Use **serena** to explore and edit code (never read whole files blindly)
4. Use **context7** for any library API you're unsure about
5. Use **sequential-thinking** before any non-trivial decision
6. Use **playwright** to verify UI changes in the browser
7. Run `npm test` (Vitest) after logic changes

$ARGUMENTS
