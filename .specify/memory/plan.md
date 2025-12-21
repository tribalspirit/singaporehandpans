/speckit.plan
Tech stack and architecture choices:

Framework & rendering:
- Astro (latest) with static output (SSG) for all routes; HTML must be pre-rendered for SEO.
- React islands only where needed (carousel, tag filters, lightbox, Calendly embed, Academy widget).
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
- Academy route exists (placeholder) and will host the Handpan Memorization Widget: /academy.
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
- Academy: interactive widget embedded as a React island; rest of the page remains SSG.

Tooling:
- ESLint + Prettier.
- Basic tests: ensure build succeeds and key routes exist in dist output.
- README with local dev, env vars, Storyblok setup, and deployment steps.

------------------------------------------------------------
Academy Handpan Memorization Widget — Implementation Plan
------------------------------------------------------------

Goal:
Build an interactive widget for handpan beginners to memorize scales and chord patterns on different handpan tunings (e.g., D-Kurd 9/10/13, Celtic).

Core technical choices:
- UI: React (island) on dedicated memorization page (`/academy/memorization`); main Academy page shows tool cards with links.
- Styling: CSS Modules + SCSS; handpan background and note pads rendered via CSS (no static image required).
- Audio: Tone.js synth-first (no samples initially). Future upgrade path: Tone.Sampler (out of scope for now).
- Theory generation: derive chords and playable scales/modes from input note sets (config-driven). Keep logic isolated in a pure “theory engine” module.

Widget architecture (modules):
- src/widgets/academy-handpan/
  - config/
    - handpans.ts: handpan definitions (notes + layout coordinates + metadata)
    - types.ts: TypeScript types and validation helpers
  - theory/
    - normalize.ts: note parsing, pitch-class normalization
    - scales.ts: derive playable scales/modes from available notes
    - chords.ts: derive triads + advanced chords (max 4 notes)
    - utils.ts: set operations, naming helpers
  - audio/
    - engine.ts: Tone.js init + playback primitives (note, chord, arpeggio)
    - scheduler.ts: arpeggio scheduling + “current note” events for UI highlight
  - ui/
    - HandpanWidget.tsx (root)
    - HandpanRenderer.tsx (CSS handpan + pads)
    - Controls.tsx (mode toggle, speed slider, play buttons)
    - Tabs.tsx (Chords / Scales)
    - ChordsPanel.tsx, ScalesPanel.tsx
  - styles/
    - *.module.scss (component styles)

Data model (config-driven):
- A single config record defines a handpan type:
  - id, name, family (optional), notes[] (Latin: A B C D E F G with #/b and optional octave digits)
  - layout: pads[] with normalized coordinates { id, note, x, y, r } where x/y/r are 0..1
- Adding a new handpan type should be possible by adding one record to config and (optionally) metadata; UI updates automatically.

Rendering approach:
- Handpan body is a pure CSS shape (radial gradients + shadows).
- Note pads are absolutely positioned circles using normalized coordinates (percentage-based).
- Highlight states:
  - selected notes (from chord/scale selection)
  - active/playing note (from audio scheduler)
  - hover/focus state (accessible, visible outline)

Audio approach (Tone.js synth-first):
- Audio engine initializes only after the first user interaction (mobile browser constraints).
- Playback primitives:
  - playNote(note, durationMs)
  - playChord(notes, durationMs) — simultaneous
  - playArpeggio(notes, bpm, direction, onStep) — scheduled sequence
- UI must visually sync with playback:
  - arpeggio step callback marks current note as “active”
  - chord playback marks multiple notes active during the chord duration

Theory engine approach:
- Normalize notes to pitch-classes for matching.
- Scales/modes:
  - compute playable scales/modes by testing candidate pitch-class sets against available notes
  - output list with display name + ordered note list for playback
- Chords:
  - basic: triads (maj/min/dim/aug when derivable)
  - advanced: up to 4 notes (e.g., 7th types, sus, add9 variants) derived from available notes
  - output list with display name + notes (ordered for arpeggio)
- Must be deterministic: same handpan config yields same chord/scale lists.

Milestones (no “Milestone F”):
A) Foundations
- Create Academy widget React island + config schema + CSS-rendered handpan with clickable pads.
B) Audio engine
- Integrate Tone.js, implement note/chord/arpeggio playback + UI highlight sync.
C) Scales/modes generation
- Generate playable scales/modes on the fly based on selected handpan; add selection + play (arpeggio only).
D) Chords generation
- Generate chord lists (basic + advanced up to 4 notes); selection highlights pads; play supports simultaneous/arpeggio + speed slider.
E) Polish
- Responsiveness, accessibility, performance tuning, and smoke tests.

Testing strategy (widget):
- Unit tests for theory engine:
  - normalization
  - chord generation determinism
  - scale/mode generation determinism
- Smoke tests:
  - Academy page renders (SSG) and widget island hydrates without runtime errors.
  - Basic playback functions do not throw when audio is initialized.

Performance constraints (widget):
- Widget code must be isolated to Academy page and loaded only when visible/needed.
- Avoid large UI libraries; prefer minimal dependencies.
- No heavy DSP libraries; Tone.js only for v1 audio.

Documentation:
- Add README section for widget:
  - how to add a new handpan tuning in config
  - how note naming works (Latin + accidentals + optional octave digits)
  - local dev notes for audio initialization (user interaction requirement)
