---
name: storyblok
description: Storyblok CMS setup and content management workflows for Events, Gallery, and Pages. Use when working with CMS content.
---

# Storyblok CMS Guide

## Quick Setup

```bash
# Setup components and folders
npm run storyblok:setup

# Create sample content
npm run storyblok:content
```

This creates: Event, Gallery Item, Page components + content folders.

## Component Commands

```bash
# Create individual components
npm run storyblok:components event
npm run storyblok:components gallery_item
npm run storyblok:components page
```

Component schemas: `/storyblok/components/`

## Content Types

### Events

**Location**: Content → Events folder

| Field            | Required | Description                      |
| ---------------- | -------- | -------------------------------- |
| Title            | Yes      | Event name                       |
| Description      | Yes      | Event details                    |
| Date & Time      | Yes      | When it happens                  |
| Location         | Yes      | Where it happens                 |
| Status           | Yes      | `upcoming` or `past`             |
| Price            | No       | Cost to attend                   |
| Booking URL      | No       | Calendly link                    |
| Image            | No       | Featured image                   |
| Tags             | No       | workshop, community, performance |
| Max Participants | No       | Capacity limit                   |

**Tips**:

- Set status to `upcoming` for future events
- Add booking URL to enable "Book Now" button
- Always **Save** and **Publish** after changes

### Gallery Items

**Location**: Content → Gallery folder

| Field       | Required | Description                         |
| ----------- | -------- | ----------------------------------- |
| Title       | Yes      | Item name                           |
| Media       | Yes      | Image or video                      |
| Description | No       | Caption text                        |
| Tags        | No       | workshop, instruments, studio, etc. |
| Featured    | No       | Displays at 2x size                 |
| Alt Text    | No       | For accessibility                   |
| Sort Order  | No       | Lower = first                       |

**Available Tags**: Workshop, Instruments, Studio, Performance, Community, Behind the Scenes, Students

## Image Guidelines

| Content | Size        | Format    | Quality |
| ------- | ----------- | --------- | ------- |
| Gallery | 1920x1080px | JPEG/WebP | 80-85%  |
| Events  | 800x600px   | JPEG/WebP | 80-85%  |

**Max file size**: 2MB

### Image Transforms

Storyblok auto-optimizes. Use transforms:

```
/640x0/    - Resize width, auto height
/0x480/    - Resize height, auto width
/filters:quality(80)/ - Adjust quality
```

## Token Management

| Environment | Token Type | Purpose           |
| ----------- | ---------- | ----------------- |
| Development | Preview    | See draft content |
| Production  | Published  | Live content only |

**Security**:

- Never commit tokens to Git
- Store in `.env` file
- `.env` in `.gitignore`

## Webhooks (Auto-Rebuild)

1. Storyblok → **Settings** → **Webhooks**
2. Click **Add a webhook**
3. **Story published**: `https://your-deploy-hook-url`
4. Save

## API Limits

**Free Tier**:

- 25,000 requests/month
- Unlimited content entries
- 100 GB bandwidth
- Rate limit: 5 requests/second

## Troubleshooting

### "Component already exists"

- Normal behavior - script updates existing
- No action needed

### "Failed to create content"

- Check Management Token is correct
- Verify Space ID matches
- Ensure you have permission

### Images Not Showing

1. Verify image is uploaded
2. Check entry is **Published** (not just Saved)
3. Clear browser cache
4. Rebuild: `npm run build`

### Content Not Updating

1. Click **Publish** after saving
2. In production, trigger rebuild via webhook

## Related Skills

- `/setup` - Environment variables
- `/gallery` - Gallery content management

## Source Documentation

- `docs/setup/STORYBLOK.md`
