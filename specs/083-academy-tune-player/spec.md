# Feature Specification: The Handpan Tab Editor's player on the Academy

**Feature Branch**: `083-academy-tune-player`
**Created**: 2026-11-24
**Status**: Draft
**Input**: Owner brief, 2026-11-24: put the Handpan Tab Editor's framed player (`/embed/`) on the
Academy, built switched off. The editor's origin comes only from `PUBLIC_TAB_EDITOR_ORIGIN`; with it
unset, no player, card or sitemap entry exists. Feature numbers are shared with the tab editor repo;
this is 083.

"The player" here is the **tab editor's** player. It is not the Studio's own handpan widget, the
Chord Explorer at `/academy/memorization/`.

> **Amended 2026-11-24 (branch `fix/academy-library-link`).** After trying the player on dev, the
> owner chose to have the Academy lead to the editor's **Library**, not to one framed tune. The
> Library can't be framed (the editor refuses framing everywhere but `/embed/`), and signing in
> inside a frame on another site would fail. So:
>
> - The "Handpan Tunes" card links straight to the editor's Library, its root page
>   (`<origin>/`), with the words "Browse the tune library in the Handpan Tab Editor: play each
>   tune with its tab, and add your own." and "Open the Library".
> - `/academy/tunes/` and its sitemap entry are removed. D3's page, tune list and page words, D4,
>   FR-004 to FR-006 and the page's success criteria no longer apply.
> - FR-001, FR-002 and FR-007 stand. FR-003 now reads: with no origin, the build has no card.
>
> The rest of this spec records the first version, as built in PR #65.

## Owner's decisions (2026-11-24)

| Decision                     | Answer                                                                                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D2, turning it on            | (a) Wait for the editor's custom domain (its feature 050). The beta stays unlisted, and this ships switched off.                                              |
| D3, where                    | _Superseded 2026-11-24, see the amendment._ `/academy/tunes/`, with a tool card on `/academy/` in the Chord Explorer card's markup                            |
| D3, which tunes              | _Superseded._ Morning Walk (`morning-walk`) only                                                                                                              |
| D3, the words                | _Superseded._ As previewed: SEO title "Handpan Tunes to Play \| Academy \| Singapore Handpan Studio"; H1 "Handpan Tunes"; card "Handpan Tunes" / "Play Tunes" |
| D3, "More Tools Coming Soon" | Replaced by the tunes card when the player is on; shown only while it is off                                                                                  |
| D4, how                      | _Superseded._ The plain `<iframe>` from the editor's "Copy embed code", not `<hp-player>`                                                                     |

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A visitor plays a library tune on the Academy (Priority: P1)

With the editor's origin configured, a visitor opens `/academy/`, follows the "Handpan Tunes" card to
`/academy/tunes/`, presses Play in the framed player, and reads the tab as it plays. If the frame
cannot load, a link under it opens the tune in the editor.

**Why this priority**: It is the feature.

**Independent Test**: Build with `PUBLIC_TAB_EDITOR_ORIGIN` set to a placeholder; `/academy/tunes/`
holds one frame per tune in the contract's form, and `/academy/` shows the card.

**Acceptance Scenarios**:

1. **Given** a valid origin, **When** the site is built, **Then** `/academy/tunes/` exists, is in the
   sitemap, and its frame is
   `<iframe src="<origin>/embed/#id=morning-walk&theme=light" title="Morning Walk, a handpan tune" width="100%" height="480" loading="lazy" style="border:0" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox">`,
   with no `allow` attribute.
2. **Given** a valid origin, **When** a visitor opens `/academy/`, **Then** the "Handpan Tunes" card
   links to `/academy/tunes/`, and the "More Tools Coming Soon" card is absent.
3. **Given** the frame cannot load, **When** the visitor looks under it, **Then** "Open in Handpan Tab
   Editor" links to `<origin>/tune/morning-walk`.

---

### User Story 2 - Nothing shows while the player is switched off (Priority: P1)

**Why this priority**: The owner chose to wait for the editor's custom domain, so this merges and
releases switched off; the editor's beta address must never reach a page.

**Independent Test**: Build with `PUBLIC_TAB_EDITOR_ORIGIN` unset; there is no `/academy/tunes/`, no
card, no sitemap entry, and "More Tools Coming Soon" shows.

**Acceptance Scenarios**:

1. **Given** the variable is unset, empty or invalid, **When** the site is built, **Then**
   `/academy/tunes/` is not built (a request for it is a 404), `/academy/` shows "More Tools Coming
   Soon" and no tunes card, and the sitemap has no `/academy/tunes/`.

### Edge Cases

- **A malformed value** (http, a path, a trailing slash, upper case, a default port, credentials,
  whitespace) counts as unset, so a dashboard typo switches the player off rather than framing a
  wrong address.
- **The frame fails to load** (the placeholder serves nothing): the page still lays out, and the
  fallback link is there.
- **Preview vs Production**: a Preview value reaches the dev environment and every branch preview.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The editor's origin MUST come only from `PUBLIC_TAB_EDITOR_ORIGIN`, read at build time
  through one module (`src/lib/tabEditor.ts`). No origin is written in code, tests, fixtures or docs
  other than `example` placeholders.
- **FR-002**: Only a bare `https` origin, as a browser writes it, is accepted; anything else means
  none. The parse MUST be unit-tested (unset, empty, http, a path, upper case, valid, and more).
- **FR-003** _(amended: with no origin, the build has no card)_: With no origin, the build MUST contain no `/academy/tunes/` page, no tunes card and no
  sitemap entry.
- **FR-004** _(superseded)_: The frame MUST be the editor's "Copy embed code" form exactly, with `&theme=light`, the
  sandbox unchanged and no `allow` attribute. The tune goes after `#`, never in the path or query.
- **FR-005** _(superseded)_: The frame's height MUST be 480 px, and 360 px when its container is 760 px or wider (a
  container query), from one SCSS map whose comment names the editor's tokens.
- **FR-006** _(superseded)_: The page MUST ship no client JavaScript.
- **FR-007**: The variable MUST be documented in `.env.example` (empty), `.claude/commands/deploy.md`
  and `docs/deployment/CLOUDFLARE.md`.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: `/dod` passes with the variable unset; the build is also green with it set to the
  placeholder `https://handpan-tab-editor.example.workers.dev`.
- **SC-002**: axe reports no violations on `/academy/` (both builds) and `/academy/tunes/`.
- **SC-003**: No horizontal overflow at 375, 768 or 1280 px; the first fold holds one frame at most,
  and every frame is `loading="lazy"`.
- **SC-004**: After merging into `dev`, the dev environment shows no tunes card and 404s
  `/academy/tunes/`.

## Not in this feature

- Setting `PUBLIC_TAB_EDITOR_ORIGIN` in Cloudflare Pages: the owner's act, after the editor's 050.
- That the frame loads and plays, and keyboard reach inside a loaded frame: they need a live editor
  origin, so they are checked when the owner turns the player on. Real devices (iOS Safari, Android
  Chrome) are the owner's.
- The editor's `frame-ancestors` list (its 050) must name the Studio's origins: production, `www`,
  the dev environment and the preview hosts if wanted. That is the editor's side.
