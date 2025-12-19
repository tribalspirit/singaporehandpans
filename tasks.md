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

- [ ] T036 [US3] Create gallery content model with tags in Storyblok CMS
- [ ] T037 [P] [US3] Create gallery page in src/pages/gallery.astro
- [ ] T038 [P] [US3] Create GalleryGrid component in src/components/GalleryGrid.astro
- [ ] T039 [P] [US3] Create GalleryItem component in src/components/GalleryItem.astro
- [ ] T040 [US3] Implement React island for tag filtering in src/components/GalleryFilter.jsx
- [ ] T041 [US3] Implement React island for lightbox viewer in src/components/Lightbox.jsx
- [ ] T042 [US3] Add image optimization and responsive images
- [ ] T043 [P] [US3] Style gallery grid with SCSS modules
- [ ] T044 [US3] Ensure gallery content remains indexable by search engines

**Checkpoint**: At this point, gallery should be fully functional with client-side interactions

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
