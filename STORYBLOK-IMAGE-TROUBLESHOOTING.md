# Storyblok Image Troubleshooting Guide

## Issue: Event Images Not Displaying

### Current Status
✅ Storyblok API connection working  
✅ Events are being fetched successfully  
✅ Image field is defined in the Event component schema  
❌ **No image data found in any events**

### Root Cause
The images uploaded to Storyblok are not being saved to the event entries. The API response shows the image field as `undefined` for all events.

### Solution Steps

#### 1. Check if Images Are Uploaded in Storyblok

1. Log into your Storyblok space: https://app.storyblok.com
2. Navigate to **Content** → **Events** folder
3. Open one of your event entries (e.g., "Beginner Handpan Workshop")
4. Scroll to the **Image** field
5. Check if there's an image in that field

#### 2. Upload/Re-upload Images

If the image field is empty:

1. Click on the **Image** field
2. Either:
   - **Upload** a new image from your computer, OR
   - Select an existing image from the **Asset Library**
3. **Important**: Click the blue **"Save"** button at the top right
4. **Important**: Click **"Publish"** to make it live

#### 3. Verify Field Name Matches

In the Event entry, ensure the field is labeled exactly as **"Image"** (case-insensitive).

The component schema expects:
```json
{
  "image": {
    "type": "asset",
    "filetypes": ["images"]
  }
}
```

#### 4. Check Content Version

The app fetches **draft** content in development and **published** content in production.

To ensure images appear:
- In development: Images should be saved (don't need to be published)
- In production: Images MUST be published

#### 5. Test After Upload

After saving/publishing images in Storyblok:

1. Refresh your local development server page: http://localhost:4322/events
2. Check the terminal logs for:
   ```
   ✅ Fetched 3 events from Storyblok, X have images
   ```
3. The number should be > 0 if images are properly saved

### Expected Image Data Structure

When properly saved, Storyblok returns image data like this:

```json
{
  "image": {
    "filename": "https://a.storyblok.com/f/YOUR_SPACE/path/to/image.jpg",
    "alt": "Event image description"
  }
}
```

### Troubleshooting Commands

To manually check if images are in your Storyblok content:

```bash
# Make sure you have STORYBLOK_TOKEN set in .env
npm run dev
```

Then check the terminal output for image status.

### Common Mistakes

1. ❌ Uploading image but not clicking "Save"
2. ❌ Saving as draft but not publishing (for production)
3. ❌ Uploading to wrong field or component
4. ❌ Image file type not supported (must be jpg, png, gif, webp, svg)

### Quick Fix Checklist

- [ ] Log into Storyblok
- [ ] Go to Events folder
- [ ] Open each event
- [ ] Add image to the "Image" field
- [ ] Click "Save"
- [ ] Click "Publish"
- [ ] Refresh local dev server
- [ ] Verify images appear

### Need Help?

If images still don't appear after following these steps:

1. Check the browser console for errors
2. Check terminal logs for fetch errors
3. Verify your STORYBLOK_TOKEN in `.env` is correct
4. Try clearing browser cache

### Current API Configuration

The app fetches events with these parameters:
```javascript
{
  starts_with: 'events/',
  content_type: 'event',
  sort_by: 'content.date:desc',
  version: 'draft' (dev) or 'published' (prod),
  resolve_assets: 1  // Ensures asset fields are properly resolved
}
```

