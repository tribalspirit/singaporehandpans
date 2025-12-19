/speckit.constitution
Create project principles for a production-ready marketing site with:
- Must be completely responsive and mobile-first (small screens first); pass Lighthouse mobile-friendly checks.
- Accessibility: semantic HTML, keyboard navigable, aria labels, sufficient contrast.
- Performance: minimal client JS; Astro islands only for interactive components; avoid heavy dependencies.
- SEO: each route must render prebuilt HTML with unique title/description, canonical, OpenGraph, Twitter cards; generate sitemap + robots.txt.
- Styling: SCSS + CSS Modules (no Tailwind). Use CSS variables for theme tokens (colors, spacing, typography).
- Content: all Events + Gallery + workshops data comes from Storyblok; no hardcoded content except safe fallbacks.
- Code quality: TypeScript strict, ESLint + Prettier, deterministic builds, clear folder structure, documented env vars.
- Testing: at least basic smoke tests for routes/build output (and a lightweight link checker if feasible).
