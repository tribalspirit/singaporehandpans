```md
---

description: "Task list for Singapore Handpan Studio Website"
---

# Tasks: Singapore Handpan Studio Website

**Input**: Design documents from `.specify/memory/`
**Prerequisites**: plan.md (tech stack), specify.md (requirements), constitution.md (principles)

**Tests**: Tests are OPTIONAL - only included if explicitly requested in future iterations.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `public/` at repository root
- Paths follow Astro project structure

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create Astro project structure with TypeScript and SCSS support
- [X] T002 Initialize package.json with Astro, TypeScript, SCSS, and Storyblok dependencies
- [X] T003 [P] Configure ESLint and Prettier for code quality
- [X] T004 [P] Setup TypeScript strict configuration in tsconfig.json
- [X] T005 [P] Create basic folder structure (src/components, src/layouts, src/pages, src/styles)
- [X] T006 [P] Setup CSS variables and tokens in src/styles/tokens.scss
- [X] T007 [P] Create global base stylesheet in src/styles/global.scss

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T008 Setup Storyblok integration with @storyblok/astro in astro.config.mjs
- [X] T009 [P] Configure environment variables for Storyblok API in .env
- [X] T010 [P] Create base layout component in src/layouts/BaseLayout.astro
- [X] T011 [P] Implement responsive header with mobile menu in src/components/Header.astro
- [X] T012 [P] Create footer component in src/components/Footer.astro
- [X] T013 Create error boundary and fallback components for CMS unreachability
- [X] T014 Setup SEO component with meta tags in src/components/SEO.astro
- [X] T015 [P] Configure Astro for static site generation (SSG) in astro.config.mjs

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Core Site Structure (Priority: P1) 🎯 MVP

**Goal**: Basic website with all static pages and navigation working

**Independent Test**: All pages load, navigation works, mobile responsive, basic SEO present

### Implementation for User Story 1

- [X] T016 [P] [US1] Create home page in src/pages/index.astro
- [X] T017 [P] [US1] Create about page in src/pages/about.astro
- [X] T018 [P] [US1] Create workshops page in src/pages/workshops.astro
- [X] T019 [P] [US1] Create contacts page in src/pages/contacts.astro
- [X] T020 [US1] Implement responsive navigation between all pages
- [X] T021 [US1] Add basic content and styling for each page
- [X] T022 [P] [US1] Generate sitemap.xml in public/sitemap.xml
- [X] T023 [P] [US1] Create robots.txt in public/robots.txt
- [X] T024 [US1] Add proper meta tags and SEO for all pages
- [X] T025 [US1] Test mobile responsiveness across all pages

**Checkpoint**: At this point, basic website should be fully functional and deployable as MVP

---

## Phase 4: User Story 2 - Events & Booking (Priority: P2)

**Goal**: Events listing with upcoming/past separation, event detail pages, and Calendly booking

**Independent Test**: Events display correctly, detail pages are SEO-friendly, Calendly embed works

### Implementation for User Story 2

- [X] T026 [US2] Create event content model in Storyblok CMS
- [X] T027 [P] [US2] Create events listing page in src/pages/events.astro
- [X] T028 [US2] Implement dynamic event detail pages in src/pages/events/[slug].astro
- [X] T029 [P] [US2] Create EventCard component in src/components/EventCard.astro
- [X] T030 [P] [US2] Create EventDetail component in src/components/EventDetail.astro
- [X] T031 [US2] Implement upcoming/past events separation logic
- [X] T032 [P] [US2] Add Calendly embed component in src/components/CalendlyEmbed.astro
- [X] T033 [US2] Integrate Calendly on events and contacts pages
- [X] T034 [P] [US2] Add Event schema JSON-LD for SEO
- [X] T035 [US2] Add proper meta tags for event detail pages

**Checkpoint**: ✅ **COMPLETED** - Events system works independently with booking functionality

---

## Phase 5: User Story 3 - Gallery with Filtering (Priority: P3)

**Goal**: Photo/video gallery with tag-based filtering and lightbox viewer

**Independent Test**: Gallery displays images, filtering works, lightbox opens properly, content is SEO-indexable

### Implementation for User Story 3

- [X] T036 [US3] Create gallery content model with tags in Storyblok CMS
- [X] T037 [P] [US3] Create gallery page in src/pages/gallery.astro
- [X] T038 [P] [US3] Create GalleryGrid React component in src/components/GalleryGrid.tsx with filtering and lightbox
- [X] T039 [P] [US3] Create GalleryItem Storyblok component in src/components/storyblok/GalleryItem.astro
- [X] T040 [US3] Implement React island for tag filtering using yet-another-react-lightbox
- [X] T041 [US3] Implement lightbox viewer with modern yet-another-react-lightbox library
- [X] T042 [US3] Add image optimization with lazy loading and responsive images
- [X] T043 [P] [US3] Style gallery grid with SCSS in src/components/GalleryGrid.scss
- [X] T044 [US3] Ensure gallery content remains indexable by search engines with SSR

**Checkpoint**: ✅ **COMPLETED** - Gallery fully functional with filtering, lightbox, and modern React components

---

## Phase 6: User Story 4 - Content Management Integration (Priority: P3)

**Goal**: Full Storyblok CMS integration with content fallbacks and build optimizations

**Independent Test**: Content updates in Storyblok reflect on site, fallbacks work when CMS is down

### Implementation for User Story 4

- [ ] T045 [P] [US4] Create workshop content model in Storyblok CMS
- [ ] T046 [P] [US4] Create studio/about content model in Storyblok CMS
- [ ] T047 [US4] Integrate Storyblok content into home page
- [ ] T048 [US4] Integrate Storyblok content into about page
- [ ] T049 [US4] Integrate Storyblok content into workshops page
- [ ] T050 [P] [US4] Implement build-time content fallbacks for CMS unavailability
- [ ] T051 [P] [US4] Document Storyblok webhook setup for auto-rebuild
- [ ] T052 [US4] Add content validation and error handling
- [ ] T053 [P] [US4] Test content updates and fallback scenarios

**Checkpoint**: All content should be manageable via Storyblok with proper fallbacks

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T054 [P] Add subtle animations and hover states across components
- [ ] T055 [P] Implement image carousel component for home page hero section
- [ ] T056 [P] Add Organization/LocalBusiness JSON-LD schema
- [ ] T057 [P] Performance optimization: minimize client-side JavaScript
- [ ] T058 [P] Accessibility audit: keyboard navigation, ARIA labels, contrast
- [ ] T059 [P] Cross-browser testing on major browsers
- [ ] T060 [P] Create README.md with setup and deployment instructions
- [ ] T061 [P] Add basic smoke tests for build output and key routes
- [ ] T062 Code cleanup and refactoring across all components
- [ ] T063 Final SEO audit and Lighthouse performance testing

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent of US1 but may reference common components
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Independent but may share styling patterns
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - May integrate with other stories' content models

### Within Each User Story

- Content models before pages that use them
- Components before pages that integrate them
- Core functionality before SEO and optimization
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Components within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Core Site Structure)
4. **STOP and VALIDATE**: Test basic website functionality
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (Events & Booking)
4. Add User Story 3 → Test independently → Deploy/Demo (Gallery)
5. Add User Story 4 → Test independently → Deploy/Demo (Full CMS)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Core Site)
   - Developer B: User Story 2 (Events)
   - Developer C: User Story 3 (Gallery)
   - Developer D: User Story 4 (CMS Integration)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

## Technology Stack Reminder

- **Framework**: Astro with static site generation (SSG)
- **Styling**: SCSS + CSS Modules, CSS variables for tokens
- **Interactive Components**: React islands only where needed
- **CMS**: Storyblok with official Astro integration
- **TypeScript**: Strict mode enabled
- **SEO**: Full meta tags, JSON-LD, sitemap, robots.txt
- **Quality**: ESLint + Prettier, accessibility standards

---

## Phase 8: Academy – Handpan Memorization Widget

**Goal**: Interactive widget for handpan beginners to memorize note positions, chord patterns, and scales/modes for different handpan tunings

**Independent Test**: Widget renders on memorization page, handpan visualization works with proper sizing and positioning, note playback functions, chord/scale generation is accurate (derived via Tonal + pcset subset filtering), UI is responsive and accessible

### Milestone A: Foundations

- [X] T064 [Academy] Create widget directory structure in `src/widgets/academy-handpan/` with config/, theory/, audio/, ui/, and styles/ subdirectories
  - **Acceptance Criteria**: Directory structure exists with proper organization; TypeScript paths resolve correctly

- [X] T065 [P] [Academy] Create handpan config schema in `src/widgets/academy-handpan/config/types.ts` with TypeScript types for handpan definitions, notes, and layout coordinates
  - **Acceptance Criteria**: Types defined for HandpanConfig, HandpanPad, Note; exports are properly typed; layout coordinates normalized (x, y, r in 0..1)

- [X] T066 [P] [Academy] Create handpan definitions config in `src/widgets/academy-handpan/config/handpans.ts` with at least D-Kurd 9/10/13 and Celtic tunings
  - **Acceptance Criteria**: Config object contains multiple handpan types with notes (Latin notation: A B C D E F G with #/b and optional octave) and normalized layout coordinates (x, y, r in 0..1 range); adding a new handpan type updates UI automatically

- [X] T067 [Academy] Install Tonal theory dependencies for scales/chords generation (avoid reinventing theory dictionaries)
  - **Files**: `package.json`
  - **Dependencies**: `@tonaljs/core`, `@tonaljs/pcset`, `@tonaljs/scale`, `@tonaljs/scale-type`, `@tonaljs/chord-type`, `@tonaljs/chord-detect`
  - **Acceptance Criteria**: Dependencies added; TypeScript types resolve; build passes; no new heavy UI dependencies introduced

- [X] T068 [P] [Academy] Create theory normalization module in `src/widgets/academy-handpan/theory/normalize.ts` using Tonal parsing for note and pitch-class normalization
  - **Acceptance Criteria**: Functions parse notes (e.g., "A#4", "Bb", "C", "D3") and normalize to pitch classes deterministically; handles octave digits and accidentals correctly; provides helpers to build pitch-class sets from arrays

- [X] T069 [P] [Academy] Create pcset helper module in `src/widgets/academy-handpan/theory/pcset.ts` using `@tonaljs/pcset` for subset checks and deterministic ordering
  - **Acceptance Criteria**: Implements `toPcSet(notes)`, `isSubset(candidate, available)`, and stable sorting/dedup helpers; no custom set math duplicates pcset logic

- [X] T070 [Academy] Create root React widget component `src/widgets/academy-handpan/ui/HandpanWidget.tsx` with handpan type selector (dropdown/button group)
  - **Acceptance Criteria**: Component renders; handpan type selector displays all config handpans; selection updates widget state; component is properly exported for Astro island

- [X] T071 [P] [Academy] Create HandpanRenderer component in `src/widgets/academy-handpan/ui/HandpanRenderer.tsx` with CSS-rendered handpan body and absolutely positioned note pads
  - **Acceptance Criteria**: Handpan body rendered via CSS (radial gradients + shadows, no static image); note pads positioned using normalized coordinates; pads are clickable and keyboard-focusable; note labels are readable on mobile

- [X] T072 [P] [Academy] Create widget styles in `src/widgets/academy-handpan/styles/` using CSS Modules + SCSS for handpan visualization, pads, and highlight states
  - **Acceptance Criteria**: Styles use CSS Modules; handpan background is pure CSS; note pads have hover/focus states; highlight states (selected, active, playing) are visually distinct; responsive on mobile

- [X] T073 [Academy] Create memorization tool page at `src/pages/academy/memorization.astro` with HandpanWidget React island, and update main Academy page at `src/pages/academy.astro` with tool cards and links
  - **Acceptance Criteria**: Memorization page renders widget; Academy page shows tool cards with descriptions; links work correctly; both pages remain SSG; widget hydrates without errors; SEO meta tags intact

**Checkpoint**: Foundation complete - handpan visualization renders with clickable pads and type selection; Tonal dependencies installed; normalization + pcset helpers in place

---

### Milestone B: Audio Engine

- [X] T074 [Academy] Install and configure Tone.js dependency in package.json
  - **Acceptance Criteria**: Tone.js added to dependencies; TypeScript types available; build passes

- [X] T075 [P] [Academy] Create audio engine module in `src/widgets/academy-handpan/audio/engine.ts` with Tone.js initialization and playback primitives (playNote, playChord, playArpeggio)
  - **Acceptance Criteria**: Audio initializes only after first user interaction (mobile-safe); playNote(note, durationMs) works; playChord(notes, durationMs) plays simultaneous notes; supports scheduling-friendly API (accepts Tone time where needed)

- [X] T076 [P] [Academy] Create audio scheduler module in `src/widgets/academy-handpan/audio/scheduler.ts` using `Tone.Transport` (and optionally `Tone.Pattern`) for arpeggio scheduling with "current note" events for UI highlight sync
  - **Acceptance Criteria**: Scheduler emits events for currently playing note during arpeggio; UI can subscribe to highlight active notes; supports up/down patterns; handles cleanup on stop/cancel; no drift across devices

- [X] T077 [Academy] Integrate audio engine into HandpanRenderer: clicking a pad plays the note via Tone.js
  - **Acceptance Criteria**: Clicking a note pad plays the note; audio works on mobile after user interaction; no console errors; visual feedback on click (brief active state)

**Checkpoint**: Audio engine functional - note playback works on click with mobile-safe initialization; arpeggio scheduling emits current-note events

---

### Milestone C: Scales/Modes Generation (Tonal-based)

- [X] T078 [P] [Academy] Create scales theory module in `src/widgets/academy-handpan/theory/scales.ts` using `@tonaljs/scale` + `@tonaljs/scale-type` and pcset subset filtering to derive playable scales/modes from available notes
  - **Acceptance Criteria**: Module enumerates scale types and tonics, generates candidate pitch-class sets, filters by subset of available handpan pitch classes using `@tonaljs/pcset`; output includes display name + ordered note list for playback; deterministic (same handpan yields same scales in same order)

- [X] T079 [P] [Academy] Create theory utilities module in `src/widgets/academy-handpan/theory/utils.ts` for stable sorting, deduplication, and octave assignment strategy for playback (no custom theory dictionaries)
  - **Acceptance Criteria**: Utility functions support deterministic ordering and converting pitch classes to playback notes (with octave handling); does not duplicate chord/scale dictionaries or set math already covered by Tonal/pcset

- [X] T080 [Academy] Create ScalesPanel component in `src/widgets/academy-handpan/ui/ScalesPanel.tsx` to display generated scales/modes with selection and play button
  - **Acceptance Criteria**: Panel displays all playable scales/modes for selected handpan; selecting a scale highlights its notes on handpan; play button plays notes as arpeggio/sequence via scheduler; UI highlights currently playing note during playback

- [X] T081 [Academy] Create Tabs component in `src/widgets/academy-handpan/ui/Tabs.tsx` for Chords/Scales panel switching
  - **Acceptance Criteria**: Tabs component switches between Chords and Scales panels; accessible keyboard navigation; active tab is clearly indicated

- [X] T082 [Academy] Integrate ScalesPanel into HandpanWidget with tab navigation
  - **Acceptance Criteria**: Scales tab displays and functions; scale selection highlights notes; play button works; visual sync with audio playback; no prerecorded sequences

**Checkpoint**: Scales/modes generation complete - users can view and play scales derived from handpan notes via Tonal + pcset filtering

---

### Milestone D: Chords Generation (Tonal-based)

- [ ] T083 [P] [Academy] Create chords theory module in `src/widgets/academy-handpan/theory/chords.ts` using `@tonaljs/chord-type` (+ optional `@tonaljs/chord-detect`) and pcset subset filtering to derive basic triads and advanced chords (≤4 notes)
  - **Acceptance Criteria**: Module generates basic (3-note) and advanced (up to 4-note) chord lists from available notes by enumerating Tonal chord types and filtering candidate pitch-class sets using `@tonaljs/pcset`; output includes display name and ordered notes; deterministic generation; de-duplicates equivalent pitch-class sets; optional chord-detect used only for ambiguous naming

- [ ] T084 [Academy] Create ChordsPanel component in `src/widgets/academy-handpan/ui/ChordsPanel.tsx` with basic/advanced categories, selection, and play controls
  - **Acceptance Criteria**: Panel displays chords in Basic and Advanced categories; selecting a chord highlights its notes on handpan; play button supports simultaneous and arpeggio modes; arpeggio speed controlled by slider; UI highlights currently playing note during arpeggio

- [ ] T085 [Academy] Create Controls component in `src/widgets/academy-handpan/ui/Controls.tsx` for mode toggle (simultaneous/arpeggio), speed slider, and play buttons
  - **Acceptance Criteria**: Mode toggle switches between simultaneous and arpeggio playback; speed slider controls arpeggio BPM; controls are accessible and responsive; state is managed in HandpanWidget and passed down cleanly

- [ ] T086 [Academy] Integrate ChordsPanel into HandpanWidget with full playback functionality
  - **Acceptance Criteria**: Chords tab displays and functions; chord selection highlights notes; simultaneous and arpeggio playback work; speed slider adjusts arpeggio; UI highlights active notes during playback; no prerecorded sequences

**Checkpoint**: Chords generation complete - users can view and play chords derived from handpan notes via Tonal + pcset filtering

---

### Milestone E: Polish

- [ ] T087 [P] [Academy] Ensure widget responsiveness across mobile, tablet, and desktop viewports
  - **Acceptance Criteria**: Widget layout adapts to screen size; handpan visualization scales appropriately; controls remain accessible; no horizontal scrolling

- [ ] T088 [P] [Academy] Add accessibility features: keyboard navigation, ARIA labels, focus indicators, screen reader support
  - **Acceptance Criteria**: All interactive elements keyboard-accessible; ARIA labels describe widget state; focus indicators visible; screen reader announces selections and playback where feasible

- [ ] T089 [P] [Academy] Performance optimization: lazy load widget code, minimize bundle size, optimize audio initialization and scheduling
  - **Acceptance Criteria**: Widget code loads only on Academy memorization page; bundle size is reasonable (prefer granular `@tonaljs/*` imports); audio initializes efficiently; no performance regressions

- [ ] T090 [Academy] Add smoke tests: Academy memorization page renders (SSG), widget hydrates without runtime errors, basic playback functions work
  - **Acceptance Criteria**: Build succeeds; memorization page renders in dist; widget island hydrates; playback functions do not throw when audio initialized

- [ ] T091 [P] [Academy] Update Academy memorization page SEO meta tags and content to reflect widget functionality
  - **Acceptance Criteria**: SEO title and description updated; page remains indexable; meta tags reflect interactive widget feature

**Checkpoint**: ✅ **COMPLETED** - Academy widget fully functional, polished, accessible, and derived via Tonal + pcset filtering

---

## Dependencies & Execution Order (Academy Widget)

### Academy Widget Dependencies

- **Milestone A (Foundations)**: Can start independently; requires React island setup knowledge
- **Milestone B (Audio Engine)**: Depends on Milestone A completion (needs handpan config and renderer)
- **Milestone C (Scales/Modes)**: Depends on Milestones A and B (needs config, renderer, and audio)
- **Milestone D (Chords)**: Depends on Milestones A, B, and C (shares theory engine patterns)
- **Milestone E (Polish)**: Depends on all previous milestones (polishes complete widget)

### Parallel Opportunities (Academy Widget)

- T065, T066, T068, T069 can run in parallel (different config/theory files)
- T071, T072 can run in parallel (renderer and styles)
- T075, T076 can run in parallel (engine and scheduler modules)
- T078, T079 can run in parallel (scales and utils modules)
- T084, T085 can run in parallel (chords panel and controls)
- T087, T088, T089 can run in parallel (different polish aspects)
```
