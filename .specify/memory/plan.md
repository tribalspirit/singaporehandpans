/speckit.plan
Tech stack and architecture choices:

Framework & rendering:
- Astro (latest) with static output (SSG) for all routes; HTML must be pre-rendered for SEO.
- React islands only where needed (carousel, tag filters, lightbox, Calendly embed, small animated widgets).
- TypeScript strict.

Styling:
- SCSS + CSS Modules for component styles.
- Global design tokens via CSS variables (src/styles/tokens.scss) and a small global base stylesheet.
- Prefer modern CSS (clamp(), container queries if needed, logical properties) and avoid utility-class frameworks.

CMS:
- Storyblok as headless CMS via official Astro integration @storyblok/astro.
- Model content types for events and gallery items in Storyblok; fetch via Delivery API at build-time.
- Provide a build-time fallback if CMS is unreachable (friendly error component and empty states).
- Prepare for webhook-triggered rebuild on publish (document how to set it up for Netlify/Cloudflare).

Routing & content:
- Static routes: /, /about, /workshops, /events, /gallery, /contacts.
- Generate event detail pages from Storyblok slugs: /events/[slug].
- Gallery uses Storyblok assets + tags; filtering is client-side (React island) but page content and images are indexable.

SEO:
- Per page: title/description/canonical/OG/Twitter meta.
- Generate sitemap + robots.txt.
- Add JSON-LD: Organization/LocalBusiness and Event schema for upcoming events.

UX:
- Responsive header with mobile menu.
- Animations: subtle section reveal and hover states; framer-motion only inside islands if used.
- Gallery: grid + lightbox; Events: cards with date/location/CTA.

Tooling:
- ESLint + Prettier.
- Basic tests: ensure build succeeds and key routes exist in dist output.
- README with local dev, env vars, Storyblok setup, and deployment steps.
