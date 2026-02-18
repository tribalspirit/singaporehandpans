## Task: Replace Calendly with Acuity Scheduling (Booking + Payments + Capacity/Sold-Out)

### Context / Current State

- Site is Astro, content is Storyblok.
- Events currently have `booking_url` and `max_participants` in Storyblok (`storyblok/components/event.json`).
- There is a Calendly embed component: `src/components/CalendlyEmbed.astro`.
- Booking today is effectively “link out / embed Calendly”, with no real-time seat counting or sold-out logic on site.

### Goal

Migrate to **Acuity Scheduling** as the booking platform with:

1. **Workshops** = fixed date/time, on-site class, limited seats, **sold-out displayed on site dynamically**
2. **Private class** = time-range booking where user picks an available slot (Acuity appointment types)
3. **Payments** collected via Acuity payment processor integration (Stripe/Square/PayPal configured in Acuity admin)
4. **Admin-friendly**: content editors only manage fields in Storyblok + Acuity IDs/links; no manual seat updates.

---

## Requirements

### Functional

1. **Event detail pages**
   - Primary CTA: **“Book this workshop”**
   - Booking should be possible in minimal clicks:
     - either embedded scheduler modal/inline widget, or
     - link-out to Acuity booking page (fallback)

2. **Workshops: sold-out state**
   - Site must show:
     - `Sold out` badge and disable booking CTA when no seats remain
     - optionally `X spots left` when low (nice-to-have)

3. **Private classes**
   - Dedicated page/section supports selecting an available time within a range using Acuity scheduler.

4. **Payments**
   - Payments are handled by Acuity checkout (no custom payment handling in Astro).

5. **Reliability**
   - Sold-out must not rely on rebuild timing alone; must be correct “near real-time”.

### Non-functional

- Keep Astro pages fast; avoid heavy client JS everywhere.
- Secrets must not leak to client.
- No “comments in diffs” rule: **do not add code comments as part of diffs** unless absolutely necessary.

---

## Proposed Architecture (Implementation)

### A) Replace Calendly embed with Acuity embed

Create `src/components/AcuityEmbed.astro` that supports two modes:

1. **Embed scheduler** (preferred UX):
   - Loads Acuity embed script once
   - Renders an embed container configured by:
     - `acuityAppointmentTypeId` (private lessons)
     - OR `acuityClassId` / “class booking URL” (workshops)

   - Provide props to choose:
     - `mode: "scheduler" | "button" | "inline"`
     - `bookingUrl` fallback

2. **Fallback** (always):
   - If embed config missing or blocked, render a normal `<a>` to `bookingUrl` (Acuity hosted page).

Also:

- Remove/stop using `CalendlyEmbed.astro`
- Update any pages that import Calendly component.

### B) Storyblok schema updates (minimal but sufficient)

Update `storyblok/components/event.json` and relevant Storyblok types to support Acuity:

Add fields (suggested):

- `booking_provider` (option): `"acuity"` default
- `booking_url` (existing): now stores Acuity booking page URL (fallback and SEO-safe)
- `acuity_type` (option): `"workshop"` | `"private"`
- `acuity_appointment_type_id` (string/number): for private lessons (time-range booking)
- `acuity_class_id` (string/number): for workshops OR a provider-specific “class occurrence” identifier
- `sold_out_override` (boolean, optional): emergency manual override
- `availability_status` (option): `"available" | "few_spots" | "sold_out"` (computed/updated by sync)
- `spots_remaining` (number, optional): computed/updated by sync
- Keep `max_participants` (existing): used as display fallback if Acuity seat info not available

Update event rendering components to use:

- `booking_provider === "acuity"` → AcuityEmbed
- show `availability_status` badge

### C) Sold-out / capacity sync (near real-time)

Implement a small server-side layer on Cloudflare Pages Functions:

1. **Webhook receiver**
   - Endpoint: `/api/acuity/webhook`
   - Receives Acuity webhook events for:
     - new booking
     - reschedule
     - cancel

   - On webhook, update Storyblok fields for the affected event:
     - `availability_status`
     - `spots_remaining`
     - (optional) `last_synced_at`

2. **Availability resolver**
   - Endpoint: `/api/acuity/availability?eventSlug=...` (or by Storyblok story ID)
   - Uses Acuity API credentials server-side
   - Fetches current remaining capacity for the specific workshop occurrence
   - Caches result (KV not required; simple in-memory cache is ok if running as Worker, but safer to do short HTTP cache headers)
   - Returns `{ status, spotsRemaining }`

3. **Front-end usage**
   - Event list page + event detail page:
     - Use Storyblok fields for initial render (fast, no JS needed)
     - Optionally “hydrate” with a tiny client fetch to `/api/acuity/availability` for accuracy:
       - only for upcoming events
       - only if `availability_status !== sold_out_override`
       - cache TTL ~ 30–120 seconds

This gives:

- immediate correctness from API polling
- webhook improves Storyblok data over time and reduces polling
- no full rebuild dependency

### D) Secrets / config

Add environment variables (Cloudflare Pages):

- `ACUITY_USER_ID` (or username/email used for API auth)
- `ACUITY_API_KEY`
- `ACUITY_WEBHOOK_SECRET` (shared secret you validate in webhook handler; if Acuity has a signature mechanism, implement that instead)
- `STORYBLOK_MANAGEMENT_TOKEN`
- `STORYBLOK_SPACE_ID`

Do not expose any of these to the client bundle.

### E) Admin workflow (must be documented)

In `docs/setup/ACUITY.md`:

- How to create:
  - appointment types for private lessons
  - classes for workshops (with capacity limits)

- How to connect payment processor in Acuity
- How to create webhooks pointing to `/api/acuity/webhook`
- How content editors should fill Storyblok fields:
  - booking URL
  - appointment type ID (private)
  - class/occurrence ID (workshops)

- Troubleshooting: sold-out badge mismatch, test mode, etc.

---

## Concrete Implementation Tasks (Claude Code)

### 1) Codebase cleanup & component swap

- [ ] Add `src/components/AcuityEmbed.astro`
- [ ] Replace all imports/usages of `CalendlyEmbed.astro` with `AcuityEmbed.astro`
- [ ] Delete or deprecate Calendly docs and references:
  - `docs/setup/CALENDLY.md` → replace with `docs/setup/ACUITY.md`

- [ ] Update any Storyblok rendering to show booking provider / status badge

**Acceptance**

- No remaining Calendly script loads in production build
- All booking CTAs point to Acuity or embed it

---

### 2) Storyblok schema migration

- [ ] Update `storyblok/components/event.json` with the new Acuity fields
- [ ] Ensure Storyblok component generation/build pipeline remains valid
- [ ] Update any TypeScript types used for Storyblok content (if you have generated types)

**Acceptance**

- Event entries can store Acuity IDs + availability fields
- Existing content using `booking_url` still works as link-out fallback

---

### 3) Cloudflare Pages Functions: Acuity API client

- [ ] Create `src/pages/api/acuity/_client.ts` (or similar) that:
  - reads env vars
  - provides minimal wrappers:
    - fetch appointment/class availability
    - fetch booked count if available

- [ ] Ensure server-only module (not imported by client code)

**Acceptance**

- Can query Acuity from server-side endpoints locally and in CF Pages env

---

### 4) Endpoint: GET availability for a workshop (for dynamic sold-out)

- [ ] Create `src/pages/api/acuity/availability.ts`
- Input: `eventSlug` (or Storyblok story ID)
- Flow:
  1. Load event data from Storyblok (public CDN token or management token read-only approach)
  2. Determine which Acuity identifier to use (`acuity_class_id` / appointment type + datetime)
  3. Query Acuity for remaining spots
  4. Return `{ availabilityStatus, spotsRemaining }`
  5. Add cache headers (e.g., `Cache-Control: public, max-age=30`)

**Acceptance**

- When a class reaches capacity in Acuity, endpoint returns `sold_out` within cache TTL
- No secrets in response

---

### 5) Endpoint: POST webhook receiver (booking/cancel/reschedule)

- [ ] Create `src/pages/api/acuity/webhook.ts`
- Validate webhook:
  - check shared secret header/query/body field (based on how you configure it)
  - reject if missing/invalid

- Dedupe:
  - store last N event IDs in memory (best effort) OR accept idempotent updates

- For affected event:
  - call `/api/acuity/availability` logic (shared function)
  - update Storyblok event fields via Management API:
    - `availability_status`
    - `spots_remaining`

- Optional:
  - if you have a build hook requirement, trigger it only when status changes (but prefer not to rebuild for every booking)

**Acceptance**

- Booking in Acuity triggers Storyblok update within seconds
- Canceling a booking re-opens availability when seats exist again

---

### 6) Front-end: show sold-out dynamically

- [ ] Update event list cards + event detail page:
  - server-render:
    - badge from Storyblok `availability_status`
    - disable CTA if `sold_out` or `sold_out_override`

  - client enhance:
    - for upcoming workshops, fetch `/api/acuity/availability?eventSlug=...`
    - update badge/CTA without full reload

**Acceptance**

- Users see “Sold out” on the site even if Storyblok value is stale
- Booking CTA disabled when sold out

---

### 7) Private lesson booking page

- [ ] Implement/adjust a page like:
  - `/lessons` or `/book-private`

- Use `AcuityEmbed` in scheduler mode configured by `acuity_appointment_type_id` (or a dedicated “private booking URL” Storyblok entry)

**Acceptance**

- Private lesson flow allows selecting any available slot in range
- Payments (if enabled) are handled in Acuity flow

---

### 8) Documentation + operational checklist

- [ ] Add `docs/setup/ACUITY.md`
- Include:
  - required env vars
  - webhook config steps
  - how to get Acuity IDs (appointment type/class IDs)
  - how to set capacity for workshops
  - how to test end-to-end with a dummy class

**Acceptance**

- A new developer can set this up without reading code

---

## Edge Cases / Rules

- If Acuity API is down:
  - front-end falls back to Storyblok `availability_status`
  - CTA still allows booking unless explicitly marked sold out

- Manual override:
  - `sold_out_override = true` always forces sold out on site

- Multi-session workshop series:
  - each Storyblok event = one fixed session (recommended)

- Timezones:
  - store event datetime in Storyblok in ISO format, always treat as Singapore time at display layer

---

## Deliverables

- New Acuity embed component
- Removed Calendly integration and docs
- Storyblok schema updated for Acuity fields
- Cloudflare Pages Functions endpoints:
  - `GET /api/acuity/availability`
  - `POST /api/acuity/webhook`

- UI shows accurate sold-out state
- Setup documentation
