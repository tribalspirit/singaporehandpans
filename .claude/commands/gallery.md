---
name: gallery
description: Gallery feature with tag-based filtering and lightbox viewer. Covers content management in Storyblok and React island implementation.
---

# Gallery Feature

Modern photo/video gallery with tag-based filtering, lightbox viewer, and Storyblok content management.

## Features

- Tag-based filtering
- Fullscreen lightbox with keyboard navigation
- Responsive grid layout
- Featured images (2x size)
- Lazy loading
- SEO-friendly (SSR)
- Accessible (keyboard nav, ARIA labels)

## Technology

- **Lightbox**: [yet-another-react-lightbox](https://yet-another-react-lightbox.com/)
- **Component**: React island (`src/components/GalleryGrid.tsx`)
- **Styles**: `src/components/GalleryGrid.scss`
- **CMS**: Storyblok

## Adding Gallery Items

### Via Storyblok UI

1. Navigate to **Content** → **Gallery** folder
2. Click **Create New** → **Gallery Item**
3. Fill in fields:
   - **Title**: Descriptive name
   - **Media**: Upload image or video
   - **Description**: Context about the image
   - **Tags**: Select categories
   - **Featured**: Check for 2x size display
   - **Photographer**: Credit attribution
   - **Alt Text**: For accessibility
   - **Sort Order**: Lower numbers appear first
4. **Save** and **Publish**

## Available Tags

| Tag               | Description                    |
| ----------------- | ------------------------------ |
| Workshop          | Images from workshop sessions  |
| Instruments       | Handpan instruments showcase   |
| Studio            | Studio interior and facilities |
| Performance       | Performance and concert photos |
| Community         | Community gatherings           |
| Behind the Scenes | Setup and preparation          |
| Students          | Student learning moments       |

## Image Guidelines

| Property  | Recommendation                                    |
| --------- | ------------------------------------------------- |
| Format    | JPEG or WebP                                      |
| Size      | 1920x1080px (landscape) or 1080x1920px (portrait) |
| Quality   | 80-85%                                            |
| File Size | < 2MB                                             |

## Using the Gallery

### Visitor Navigation

- Visit `/gallery`
- Click filter buttons for specific categories
- Click image to open lightbox
- **← → Arrow keys**: Previous/next
- **ESC**: Close lightbox
- **Swipe/click**: Navigate

## Customization

### Modify Tags

1. Edit `storyblok/components/gallery_item.json`
2. Update the `tags` options array
3. Run `npm run storyblok:components gallery_item`

### Styling

File: `src/components/GalleryGrid.scss`

CSS variables:

- `--color-primary` - Active filter button
- `--color-surface` - Card backgrounds
- `--spacing-*` - Layout spacing
- `--border-radius-*` - Corner rounding

### Grid Layout

Default: `minmax(300px, 1fr)`

```scss
// src/components/GalleryGrid.scss
.gallery-grid {
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); // Wider cards
}
```

## Accessibility

- Full keyboard navigation
- ARIA labels on interactive elements
- Visible focus indicators
- Alt text required for all images
- WCAG AA color contrast

## Performance

- Lazy loading (images load on scroll)
- Code splitting (lightbox on demand)
- 32KB React component (12KB gzipped)
- Images served from Storyblok CDN

## Troubleshooting

### Images Not Displaying

1. Check Storyblok entry is **Published**
2. Verify image URL in browser DevTools
3. Check browser console for errors
4. Try hard refresh (Ctrl+Shift+R)

### Filtering Not Working

1. Verify tags saved in Storyblok
2. Check browser console for errors
3. Ensure React hydration completed

### Lightbox Issues

1. Check `yet-another-react-lightbox` is installed
2. Verify no JavaScript errors
3. Try different browser

## Related Skills

- `/storyblok` - CMS content management

## Source Documentation

- `docs/features/GALLERY.md`
