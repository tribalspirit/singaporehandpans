# Gallery Feature

Modern photo/video gallery with tag-based filtering and lightbox viewer.

## Features

- **Tag-Based Filtering** - Filter images by category
- **Modern Lightbox** - Fullscreen viewing with keyboard navigation
- **Responsive Grid** - Adapts to all screen sizes
- **Featured Images** - Highlight important photos at 2x size
- **Lazy Loading** - Optimized performance
- **SEO-Friendly** - Server-side rendered for search engines
- **Accessibility** - Full keyboard navigation and ARIA labels

## Technology

- **Lightbox**: [yet-another-react-lightbox](https://yet-another-react-lightbox.com/)
- **Framework**: React island for interactivity
- **CMS**: Storyblok for content management

## Adding Gallery Items

### Via Storyblok UI

1. Navigate to **Content** → **Gallery** folder
2. Click **Create New** → **Gallery Item**
3. Fill in fields:
   - **Title**: Descriptive name
   - **Media**: Upload image or video
   - **Description**: Context about the image
   - **Tags**: Select categories
   - **Featured**: Check to make item prominent (2x size)
   - **Photographer**: Credit attribution
   - **Alt Text**: For accessibility
   - **Sort Order**: Lower numbers appear first
4. **Save** and **Publish**

### Available Tags

- **Workshop** - Images from workshop sessions
- **Instruments** - Handpan instruments showcase
- **Studio** - Studio interior and facilities
- **Performance** - Performance and concert photos
- **Community** - Community gatherings
- **Behind the Scenes** - Setup and preparation
- **Students** - Student learning moments

## Using the Gallery

### For Visitors

1. Visit `/gallery` page
2. Click filter buttons to view specific categories
3. Click any image to open lightbox
4. Navigate with:
   - **← → Arrow keys** - Previous/next image
   - **ESC** - Close lightbox
   - **Mouse/Touch** - Swipe or click arrows

### For Content Editors

**Best Practices**:
- Use high-quality images (1920x1080px recommended)
- Add descriptive titles and alt text
- Categorize with appropriate tags
- Mark 2-3 special items as "featured"
- Keep file sizes under 2MB
- Use descriptive filenames

**Image Guidelines**:
- **Format**: JPEG or WebP
- **Size**: 1920x1080px (landscape) or 1080x1920px (portrait)
- **Quality**: 80-85%
- **File Size**: < 2MB

## Customization

### Filter Tags

To add or modify tag options:

1. Edit `storyblok/components/gallery_item.json`
2. Update the `tags` options array
3. Run `npm run storyblok:components gallery_item`

### Styling

Gallery styles are in `src/components/GalleryGrid.scss`.

Customizable via CSS variables:
- `--color-primary` - Active filter button
- `--color-surface` - Card backgrounds
- `--spacing-*` - Layout spacing
- `--border-radius-*` - Corner rounding

### Grid Layout

Default: `minmax(300px, 1fr)`

To change columns:
```scss
// src/components/GalleryGrid.scss
.gallery-grid {
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); // Wider cards
}
```

## Accessibility

- **Keyboard Navigation**: Full support
- **Screen Readers**: ARIA labels on all interactive elements
- **Focus Management**: Visible focus indicators
- **Alt Text**: Required for all images
- **Color Contrast**: WCAG AA compliant

## Performance

- **Lazy Loading**: Images load as you scroll
- **Code Splitting**: Lightbox loads on demand
- **Optimized Bundle**: 32KB React component (12KB gzipped)
- **CDN**: Images served from Storyblok CDN

## Troubleshooting

### Images Not Displaying

1. Check Storyblok entry is Published
2. Verify image URL in browser DevTools
3. Check browser console for errors
4. Try hard refresh (Ctrl+Shift+R)

### Filtering Not Working

1. Verify tags are saved in Storyblok
2. Check browser console for errors
3. Ensure React hydration completed

### Lightbox Issues

1. Check `yet-another-react-lightbox` is installed
2. Verify no JavaScript errors in console
3. Try in different browser

## Future Enhancements

Potential additions:
- Video playback in lightbox
- Image zoom on hover
- Social sharing buttons
- Download high-res option
- Infinite scroll pagination
- Search by title/description
- Multi-tag filtering (AND/OR logic)


