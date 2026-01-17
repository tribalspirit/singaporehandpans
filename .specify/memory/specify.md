/speckit.specify
Build a lightweight, SEO-friendly website for a Handpan Music Studio with the following pages:

- Home ✅
- About ✅
- Our Workshops ✅
- Events ✅
- Gallery ✅
- Contacts ✅
- Academy (placeholder exists; must be completed) ✅
- Shop (feature-toggled, Shopify integration) ✅

User goals:

- Discover the studio, vibe, teachers, and workshops. ✅
- See upcoming events and book via Calendly. ✅
- Browse an attractive gallery of photos/videos. ✅
- Contact the studio via social links and a contact section. ✅
- Learn fundamentals in the Academy section using interactive tools (new). ✅

Key requirements:

- Fully responsive and mobile-friendly design across iPhone/Android/tablet/desktop. ✅
- Smooth, modern UI with subtle animations and an image carousel. ✅
- Events listing with upcoming/past separation, and event detail pages (or modal) that are indexable by search engines. ✅
- Gallery grid with filtering by tags and a lightbox viewer. ✅
- Calendly embed for booking (inline on Events page and/or Contacts page). ✅
- Content is editable in Storyblok by non-technical users. ✅

---

## New feature: Academy Handpan Memorization Widget

Placement:

- Widget must be part of the Academy section (/academy), which is already implemented as a placeholder.
- The Academy page remains SSG; widget is a React island.

Widget purpose:

- Help handpan beginners quickly memorize:
  - note positions on a handpan
  - playable chord patterns/arpeggios
  - playable scales/modes for a selected handpan tuning

Functional requirements:

1. Handpan visualization

- Display a handpan and note positions (pads) on it.
- Support multiple handpan types/scales (e.g., D-Kurd 9/10/13, Celtic, etc.).
- User can switch handpan type easily (dropdown and/or button group).
- Handpan background + note placeholders must be dynamically generated using CSS (no static background image required).
- Config-driven: handpan types are stored in a JS/TS config object; adding a new record automatically updates UI lists and rendering.
- Notes use standard Latin symbols: A B C D E F G with #/b and optional digits for octave.

2. Note playback

- Clicking a note plays the note.
- Implementation uses Tone.js (synth-first). No pre-recorded sequences.
- Playback must work on mobile (init audio only after user interaction).

3. Chords/arpeggios panel

- Display all possible chords/arpeggios playable on the selected handpan type.
- Two categories:
  - Basic: 3-note chords (major/minor/aug/dim where applicable)
  - Advanced: up to 4-note chords (e.g., min7/maj7/9-derived etc., capped at 4)
- Chord list is generated dynamically based on the selected handpan note set.
- Selecting a chord highlights its notes on the handpan.
- Nice-to-have (required if feasible within scope): Play button.
  - Modes:
    - Simultaneous (play all notes together)
    - Arpeggio (play in sequence)
  - Arpeggio speed controlled by a slider.
  - UI highlights which note is currently being played during arpeggio.
- No pre-recorded chord sequences; generate dynamically (Tone.js scheduling).

4. Scales/modes panel

- Display all possible scales/modes playable on the selected handpan type.
- Scale/mode list is generated dynamically based on the selected handpan note set.
- Selecting a scale highlights its notes on the handpan.
- Play button plays notes as an arpeggio/sequence (no simultaneous mode).
- UI highlights the currently playing note during playback.
- No pre-recorded sequences; generate dynamically.

Non-goals:

- No custom backend API.
- No user accounts.
- No in-site payments (Shop uses Shopify checkout).
- No MIDI-out support in v1 (not needed for initial release).
- No Tone.Sampler/sample packs in v1 (future upgrade only).

---

## New feature: Shop (Shopify Integration)

Placement:

- Shop page at /shop, feature-toggled via PUBLIC_ENABLE_SHOP env var.
- When disabled: no Shop link in nav, /shop redirects to 404.

Shop purpose:

- Display handpans and accessories from Shopify store.
- Allow users to browse, search, and filter products.
- "Buy" links redirect to Shopify product pages for checkout.

Functional requirements:

1. Product display

- Fetch products from Shopify Storefront API at build time.
- Display product grid with image, title, description, price, category.
- Show availability status (In Stock / Sold Out).

2. Search and filtering

- Search input: keyword match on title, description, tags.
- Category filter: dropdown populated from product types.
- Price filter: preset buckets (Under S$500, S$500-S$1,500, Above S$1,500).
- Availability filter: All / In Stock / Out of Stock.
- Client-side filtering (no API calls after initial load).

3. Buy flow

- "Buy" button links to Shopify product page (target="\_blank").
- No cart or checkout on site; handled by Shopify.

Non-goals for Shop:

- No in-site cart or checkout.
- No inventory management (managed in Shopify).
- No customer accounts on site.
