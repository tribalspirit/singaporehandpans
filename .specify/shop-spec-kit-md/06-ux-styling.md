# 6. UX & Styling Guidelines

## 6.1 Visual style

- Minimal, calm layout consistent with site’s existing typography and spacing.
- Use existing design tokens / CSS variables for color and spacing.
- Product cards: light border or subtle shadow, rounded corners, white background.

## 6.2 Layout

- Filter bar above product grid:
  - Search input
  - 3 dropdowns (Category / Price / Availability)
- Use responsive layout:
  - Desktop: inline controls, product grid 3–4 columns
  - Tablet: 2 columns
  - Mobile: 1 column, controls stack

Example grid CSS:

```css
.productsGrid {
  display: grid;
  gap: var(--spacing-lg);
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}
```

## 6.3 Accessibility

- Provide labels or `aria-label` for inputs/selects.
- Product images must have alt text (fallback to title).
- Ensure “Buy” buttons are keyboard reachable.
- Ensure adequate contrast for text and badges.

## 6.4 Micro-interactions

- Hover state for cards and buttons.
- Sold-out badge or disabled state when `availableForSale` is false.
- Empty state message when filters yield no results.

## 6.5 Performance

- Lazy-load product images (`loading="lazy"`).
- No heavy libraries for filtering/sorting.
