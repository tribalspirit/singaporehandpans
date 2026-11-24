# Feature Specification: Handpan Tab Editor sections on /privacy/ and /terms/

**Feature Branch**: `082-tab-editor-legal-sections`
**Created**: 2026-11-24
**Status**: Draft
**Input**: Owner brief, 2026-11-24: add the Handpan Tab Editor's sections to the Studio's privacy and
terms pages, from the drafts of 2026-11-18 (the tab editor's feature 080), with the owner's answers
to the drafts' placeholders and clashes. Feature numbers are shared with the tab editor repo, whose
highest was 081; this is 082.

> The legal text is a draft the owner approves. It is not legal advice.

## Why

The tab editor's PR #90 (its feature 080) turns sign-in on at its beta. Its last story needs two facts
from these pages: the anchor of the terms' "Licence for published tunes" sub-section, and the date the
pages show as "Last Updated" (`YYYY-MM-DD`), which becomes the editor's `TERMS_VERSION`. Everything
reaches the dev environment (`https://dev.singaporehandpans.pages.dev`) on merge into `dev`, and
production (`https://singaporehandpans.com`) on the release `dev` → `main`.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - An editor user reads what the editor keeps about them (Priority: P1)

Someone about to sign in to the Handpan Tab Editor follows its link to `/privacy/` and finds a section
that says what the editor keeps, who sees it, which cookies it sets, how long things last, and how to
delete the account.

**Why this priority**: The editor must not switch sign-in on until this is published.

**Independent Test**: Open `/privacy/#tab-editor`; the page lands on "12. Handpan Tab Editor", and its
sub-sections 12.1–12.12 carry the drafts' words with the owner's answers.

**Acceptance Scenarios**:

1. **Given** the built site, **When** a visitor opens `/privacy/#tab-editor`, **Then** the heading
   "12. Handpan Tab Editor" is in view below the sticky header, at 375 px and at 1280 px.
2. **Given** the privacy page, **When** a visitor reads it, **Then** "Contact Us" is section 13 and
   no `[OWNER` mark remains.

---

### User Story 2 - An author agrees to the licence for published tunes (Priority: P1)

An author submitting a tune follows the editor's link to
`https://singaporehandpans.com/terms/#tab-editor-licence` and lands on "19.3 Licence for published
tunes", dated with the version the editor records.

**Why this priority**: That address and date are the contract the editor's 080 records on every
submission.

**Independent Test**: Open `/terms/#tab-editor-licence`; the heading is in view below the sticky
header at 375 px and 1280 px, and the sub-section ends "This version is dated November 25, 2026."

**Acceptance Scenarios**:

1. **Given** the built site, **When** a visitor opens `/terms/#tab-editor-licence`, **Then** the
   "19.3 Licence for published tunes" heading is in view, not under the header.
2. **Given** the terms page, **When** a visitor reads it, **Then** "Contact Information" is section
   20, the editor's section says it applies in place of 8.3 for tunes and of 8.2 for published tunes,
   and no `[OWNER` mark remains.

---

### User Story 3 - Visitors see when the pages changed (Priority: P2)

Terms 16 and privacy 11 promise to update the "Last Updated" date when the pages change.

**Independent Test**: Both pages show "Last Updated: November 25, 2026".

**Acceptance Scenarios**:

1. **Given** the change is live (dev, then production), **When** a visitor opens either page, **Then**
   it shows "Last Updated: November 25, 2026".

### Edge Cases

- **The release slips past 2026-11-25.** The date on both pages and the licence version change
  through a PR into `dev` before the release, so production shows the day production got the change.
- **The licence's words change later.** Its version date must change with them, and the tab editor
  must be told the new date.
- **Narrow screens.** The privacy tables (cookies, retention) and the long cookie name must not force
  horizontal scrolling at 320 px.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: `/privacy/` MUST gain "12. Handpan Tab Editor" (`<h2 id="tab-editor">`) before the contact
  section, which becomes "13. Contact Us".
- **FR-002**: `/terms/` MUST gain "19. Handpan Tab Editor" (`<h2 id="tab-editor">`) before the contact
  section, which becomes "20. Contact Information".
- **FR-003**: The terms' "Licence for published tunes" sub-section MUST be
  `<h3 id="tab-editor-licence">`. The id is the contract; its visible number is not.
- **FR-004**: The words MUST be the drafts' (`legal-drafts-080.md` parts 2 and 3), with the owner's
  answers below; `grep -n "\[OWNER" src/pages/privacy.astro src/pages/terms.astro` prints nothing.
- **FR-005**: Contact details MUST come from `src/constants/contacts` (no hard-coded address).
- **FR-006**: `lastUpdated` on both pages MUST be `November 25, 2026`, and the licence's version
  date MUST be the same day (`2026-11-25`), kept in one constant with a comment naming the editor's
  `TERMS_VERSION`.
- **FR-007**: Headings MUST run h1 → h2 → h3 with none skipped. No other section changes.
- **FR-008**: The pages MUST name and link no address of the tab editor.
- **FR-009**: The pages stay hand-written Astro, `noindex`, and out of the sitemap.

### Owner's answers (2026-11-24)

| Item                                        | Answer                                                              |
| ------------------------------------------- | ------------------------------------------------------------------- |
| Contact address                             | `STUDIO_EMAIL`, as a mailto link                                    |
| Legal entity                                | Mark deleted: "run by the Studio"                                   |
| Grounds for a ban                           | The drafts' default                                                 |
| Arrangements of other people's songs        | Allowed only if the song is in the public domain or with permission |
| What listeners may do                       | The drafts' narrow list                                             |
| Copies after the licence ends               | They may go on using them under "What listeners may do"             |
| Date                                        | November 25, 2026 (`2026-11-25`)                                    |
| Terms 4                                     | Unchanged; the editor section covers the emailed-link credential    |
| Terms 8.2 / 8.3                             | Unchanged; the editor section applies in their place, as drafted    |
| Privacy 1.3                                 | Unchanged; the editor section covers the editor's cookies           |
| Legal bases line                            | Added to section 12's opening                                       |
| Resend location, D1 backups, click tracking | Left out                                                            |
| Free to use                                 | Added: "The editor is free to use."                                 |

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: `/terms/#tab-editor-licence` lands on its heading at 375 px and 1280 px, on the built
  site, then on dev, then in production.
- **SC-002**: Both pages show "Last Updated: November 25, 2026" on dev and in production.
- **SC-003**: `/dod` passes, and axe reports no violations on either page.
