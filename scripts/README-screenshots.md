# Screenshot Generation Script

Automated screenshot capture for all pages using Playwright.

## Usage

1. **Start the dev server** (in a separate terminal):
   ```bash
   npm run dev
   ```

2. **Run the screenshot script**:
   ```bash
   npm run screenshots
   ```

## Features

- ✅ Captures **all pages** of the site
- ✅ **Three viewport sizes**: Desktop (1440x900), Tablet (768x1024), Mobile (375x812)
- ✅ **Full-page screenshots** including content below the fold
- ✅ Organized by device type in separate folders
- ✅ Automatic network idle wait for complete rendering
- ✅ Error handling with clear console feedback

## Output Structure

```
screenshots/
├── desktop/
│   ├── home.png
│   ├── about.png
│   ├── academy.png
│   ├── academy-memorization.png
│   ├── events.png
│   ├── event-beginner-workshop.png
│   ├── event-community-gathering.png
│   ├── gallery.png
│   └── contacts.png
├── tablet/
│   └── [same files]
└── mobile/
    └── [same files]
```

## Pages Captured

- Home (`/`)
- About (`/about`)
- Academy (`/academy`)
- Handpan Chord Explorer (`/academy/memorization`)
- Events List (`/events`)
- Event Detail Pages (fallback events)
- Gallery (`/gallery`)
- Contacts (`/contacts`)

## Adding New Pages

Edit `scripts/screenshots.ts` and add to the `pages` array:

```typescript
const pages = [
  // ... existing pages
  { path: '/new-page', name: 'new-page' },
];
```

## Requirements

- Node.js 18+
- Dev server running on `http://localhost:4321`
- Playwright (installed automatically with dependencies)

## Troubleshooting

**Dev server not running:**
```
Error: net::ERR_CONNECTION_REFUSED at http://localhost:4321
```
→ Start the dev server first: `npm run dev`

**Timeout errors:**
- Increase timeout in script if pages load slowly
- Check network connection for external resources (fonts, images)

**Missing screenshots:**
- Check console output for specific page errors
- Verify page routes exist and are accessible

