# Storyblok CMS Setup

Complete guide for setting up and using Storyblok CMS for content management.

## Overview

Storyblok is used as the headless CMS for:

- Event listings and details
- Gallery images with tags
- Page content (future expansion)

## Automated Setup (Recommended)

### 1. Setup Components and Folders

```bash
npm run storyblok:setup
```

This creates:

- Event component schema
- Gallery Item component schema
- Page component schema
- Content folders (Events, Gallery, Pages)

### 2. Create Sample Content

```bash
npm run storyblok:content
```

This creates sample:

- 3 event entries
- 2 gallery items
- 1 page entry

### 3. Add Images

Sample content is created without images. To add images:

1. Go to Storyblok → **Content** → **Events** or **Gallery**
2. Click on an entry
3. Click the **Image** or **Media** field
4. Upload or select an image
5. **Save** and **Publish**

## Manual Setup

If you prefer manual setup or need to create individual components:

### Create Single Component

```bash
npm run storyblok:components event
npm run storyblok:components gallery_item
npm run storyblok:components page
```

### Component Schemas

Component definitions are in `/storyblok/components/`:

- `event.json` - Event schema
- `gallery_item.json` - Gallery item schema
- `page.json` - Page schema

## Content Management

### Events

**Location**: Content → Events folder

**Required Fields**:

- Title
- Description
- Date (start date and time)
- Location

**Optional Fields**:

- End date — see _Multi-day events_ below
- Recurrence / Repeat until — see _Repeating classes_ below
- Duration (hours; ignored when End date is set)
- Price
- Booking URL (Acuity Scheduling link)
- Image
- Tags (workshop, community, performance, beginner, intermediate, advanced, private)
- Max Participants
- SEO title / SEO description

#### Multi-day events

Set **Date** to when it starts and **End date** to when it finishes. One
story, not one per day.

> A Saturday–Sunday masterclass is `Date = Sat 14 Mar 13:00`,
> `End date = Sun 15 Mar 16:00`. The card reads "14–15 Mar 2026".

Do **not** create a second story with a `-day-2` slug, and do not put the
date range in the title or the slug — the site works it out from the fields.

#### Repeating classes

For a class that runs on a schedule, create **one** story and set:

- **Date** — the first session (its weekday and time drive every repeat)
- **Recurrence** — Every week / Every 2 weeks / Every month
- **Repeat until** — the last date it runs

> Yana's Saturday class is `Date = Sat 1 Aug 10:30`, `Recurrence = Every week`,
> `Repeat until = 27 Dec`. The card reads "Every Saturday, 10:30 am — until
> 27 Dec 2026" and shows the next session automatically.

You never need to re-create it week to week. Leaving **Repeat until** blank
works, but the site only shows 12 months ahead, so set it where you can.

If a single session in a series is cancelled or moved, the schedule has no
per-session exceptions — take the date out of the series and add a one-off
story for the replacement.

#### Upcoming vs past

**Nothing to do — this is automatic.** Upcoming and past are worked out from
the dates:

- `/events/` shows anything that has not finished yet
- `/events/archive/` shows everything else, grouped by year and month

An event stays on `/events/` until its session actually **ends**, so a class
does not vanish halfway through. A multi-day event stays up for its whole
span, and a repeating class stays up until its final session.

Past events are **never** unpublished or deleted. Every one keeps its page
and its text so it continues to earn search traffic.

The **Status** field is legacy. Only `Cancelled` does anything (it marks the
event cancelled for search engines) — you never need to set anything to
"past".

**Important**:

- Add booking URL to enable "Book Now" button
- Always click **Save** and **Publish** after changes

### Gallery Items

**Location**: Content → Gallery folder

**Required Fields**:

- Title
- Media (image or video)

**Optional Fields**:

- Description
- Tags (workshop, instruments, studio, etc.)
- Featured (displays item at 2x size)
- Photographer credit
- Alt text (for accessibility)
- Sort order (lower numbers appear first)

**Best Practices**:

- Use descriptive titles
- Add alt text for accessibility
- Use tags for filtering
- Mark 2-3 items as "featured"
- Keep image sizes reasonable (< 2MB)

## Image Optimization

### Recommended Image Sizes

- **Gallery Images**: 1920x1080px (landscape) or 1080x1920px (portrait)
- **Event Images**: 800x600px (landscape)
- **Format**: JPEG or WebP
- **Quality**: 80-85%

### Storyblok Image Service

Storyblok automatically optimizes images. You can use image transforms:

```
https://a.storyblok.com/f/SPACE_ID/WIDTHxHEIGHT/HASH/image.jpg
```

Available transforms:

- `/640x0/` - Resize width, auto height
- `/0x480/` - Resize height, auto width
- `/filters:quality(80)/` - Adjust quality

## Webhooks (Optional)

To auto-rebuild on content changes:

1. In Storyblok: **Settings** → **Webhooks**
2. Click **Add a webhook**
3. **Story published**: `https://your-deploy-hook-url`
4. Save

This triggers automatic rebuilds when you publish content.

## Troubleshooting

### "Component already exists"

- This is normal - the script updates existing components
- No action needed

### "Failed to create content"

- Check your Management Token is correct
- Verify Space ID matches your space
- Ensure you have permission to create content

### Images Not Showing

1. Verify image is uploaded in Storyblok
2. Check entry is **Published** (not just Saved)
3. Clear browser cache
4. Rebuild site: `npm run build`

### Content Not Updating

1. Always click **Publish** after saving
2. In development, changes appear immediately
3. In production, may need to trigger rebuild

## API Limits

**Free Tier**:

- 25,000 API requests/month
- Unlimited content entries
- 100 GB bandwidth

**Rate Limits**:

- 5 requests/second per space
- Automatic throttling if exceeded

## Security

### Token Management

- ✅ Use Preview token for development
- ✅ Use Published token for production
- ❌ Never commit tokens to Git
- ✅ Store tokens in `.env` file
- ✅ Add `.env` to `.gitignore`

### Access Control

- Manage team members in **Settings** → **Users**
- Assign appropriate roles (Admin, Editor, etc.)
- Use SSO for enterprise accounts

## Resources

- [Storyblok Documentation](https://www.storyblok.com/docs)
- [Content Delivery API](https://www.storyblok.com/docs/api/content-delivery)
- [Management API](https://www.storyblok.com/docs/api/management)
- [Image Service](https://www.storyblok.com/docs/image-service)
