# Upcoming Events Widget

Create and integrate a modern, visually striking "Upcoming Events" widget for the Home page. This widget must become the primary focus element of the Home page.

When users land on the site, they should:

- Immediately see upcoming events
- Understand date, format, and availability
- Be able to book in minimal clicks (1–2 max)

---

## Functional Requirements

### 1. Data Source

Events must be dynamically loaded from Storyblok Events section. Assume existing or create:

**Events content type in Storyblok**

Fields:

- `title` (string)
- `date` (datetime)
- `location` (string)
- `short_description` (text)
- `image` (asset)
- `booking_url` (string)
- `availability_status` (enum: available / few_spots / sold_out)
- `price` (optional string)

**Filtering & display**

- Only show future events (`date >= today`)
- Sorted ascending by date
- Max 3 events displayed
- If more exist → show "View All Events" button

---

## UI/UX Requirements

### 2. Visual Hierarchy

This must look like a premium modern event showcase.

**Layout behavior**

- **Desktop:** Full-width section, large section title "Upcoming Events", 3 event cards in horizontal grid, strong hero-style feeling, subtle animation on hover
- **Tablet:** 2 cards per row
- **Mobile:** Horizontal scroll carousel OR stacked vertical cards, touch-friendly spacing
- Booking button always clearly visible

### 3. Event Card Design

Each card must include:

- Event image (top)
- Date (visually prominent badge style)
- Title
- Location
- Short description (2 lines max, ellipsis)
- **Availability indicator:**
  - Green dot: Available
  - Orange dot: Few spots left
  - Red dot: Sold out
- **Primary CTA button:** "Book Now" (disabled if sold out)

**Visual style**

- Soft rounded corners (border-radius 16–24px)
- Subtle shadow (not heavy)
- Light glass / airy aesthetic
- Slight hover lift effect
- Smooth transition animations (200–300ms ease)

---

## Conversion Optimization

The booking CTA must:

- Be visually dominant
- Use high contrast color (accent brand color)
- Be full-width on mobile
- Use clear language

If event is sold out:

- Button disabled
- Replace text with "Sold Out"

---

## Performance Requirements

- SSR-friendly Astro implementation
- Fetch Storyblok via official SDK
- Avoid client-side hydration unless necessary
- If carousel used → lightweight, no heavy library

---

## Component Structure

**Create**

- `src/components/home/UpcomingEvents.astro`
- `src/components/home/EventCard.astro`
- `src/styles/components/_upcoming-events.scss`

**Integrate into**

- `src/pages/index.astro`

---

## Edge Cases

If no upcoming events:

- Show elegant empty state: "New events coming soon"
- CTA: "Join Newsletter"

---

## Accessibility

- Proper semantic HTML
- Buttons are actual `<button>` or `<a>`
- Images have alt text
- Color contrast AA compliant

---

## Deliverables

- Astro components
- SCSS styling
- Storyblok query logic
- Clean integration into Home page
- Responsive behavior implemented
- No unnecessary comments in diffs

---

## Design Tone

This is not a corporate tech widget. It should feel:

- Calm
- Musical
- Elegant
- Slightly artistic
- Premium but not flashy

_"Boutique music studio meets modern minimal design."_

If you need to introduce a small reusable UI primitive (Badge, Button, StatusDot), create it properly in a shared components folder. Implement clean, production-ready code.
