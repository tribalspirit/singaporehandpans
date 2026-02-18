---
name: setup
description: Local development environment setup for SG Handpan Studio. Covers Node.js, Storyblok tokens, Calendly integration, and troubleshooting.
---

# Development Environment Setup

## Prerequisites

- Node.js 18+ and npm
- Git
- VS Code (recommended)
- Storyblok account (free tier available)

## Quick Start

```bash
npm install
# Create .env file (see below)
npm run dev
# Visit http://localhost:4321
```

## Environment Variables

Create `.env` in project root:

```bash
# Storyblok CMS (Required)
STORYBLOK_TOKEN=your_preview_token_here
STORYBLOK_MANAGEMENT_TOKEN=your_management_token_here
STORYBLOK_SPACE_ID=your_space_id_here

# Site Configuration
NODE_ENV=development
PUBLIC_SITE_URL=http://localhost:4321

# Calendly Integration (Optional)
PUBLIC_CALENDLY_EVENT_URL=https://calendly.com/your-username/event
PUBLIC_CALENDLY_PRIVATE_URL=https://calendly.com/your-username/private-session

# Shop (Optional - disabled by default)
PUBLIC_ENABLE_SHOP=false
PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
PUBLIC_SHOPIFY_STOREFRONT_TOKEN=your_storefront_token
```

## Storyblok Token Setup

### Preview Token (Required)

1. Go to [Storyblok](https://app.storyblok.com/)
2. Select your space → **Settings** → **Access Tokens**
3. Copy the **Preview** token
4. Add to `.env` as `STORYBLOK_TOKEN`

### Management Token (For Automation)

1. Go to [Account Settings](https://app.storyblok.com/#!/me/account?tab=token)
2. Click **Generate new token**
3. Name it (e.g., "CLI Automation")
4. Copy immediately (shown only once!)
5. Add to `.env` as `STORYBLOK_MANAGEMENT_TOKEN`

### Space ID

1. In Storyblok → **Settings** → **General**
2. Copy the numeric **Space ID**
3. Add to `.env` as `STORYBLOK_SPACE_ID`

## Calendly Integration

### Get URLs

1. Log into [Calendly](https://calendly.com/)
2. Go to your event types
3. Copy booking URL for each event

### Configure in Storyblok

1. Edit event in Storyblok
2. Add Calendly URL to **Booking URL** field
3. Save and Publish

### Implementation Options

- **Redirect (current)**: Opens Calendly in new tab - simple, mobile-friendly
- **Embed**: Install `react-calendly` and update `CalendlyEmbed.astro`

## Verification Checklist

- [ ] Dev server starts without errors
- [ ] `http://localhost:4321` loads
- [ ] Browser console has no errors
- [ ] `/events` page loads content from Storyblok
- [ ] "Book Now" buttons link to Calendly

## Troubleshooting

### "STORYBLOK_TOKEN not found"

- Ensure `.env` file exists in project root
- Verify token copied correctly (no extra spaces)
- Restart dev server after adding `.env`

### "Failed to fetch from Storyblok"

- Verify tokens are correct
- Check Space ID matches your space
- Use Preview token (not Published) for development
- Check network connection

### Build Errors

```bash
# Clear cache and rebuild
rm -rf node_modules dist .astro
npm install
npm run build
```

### Calendly Button Not Working

- Check URL is correct in Storyblok
- Verify environment variable is set
- Restart dev server after changing `.env`

## Related Skills

- `/storyblok` - CMS content management
- `/deploy` - Cloudflare deployment

## Source Documentation

- `docs/setup/ENVIRONMENT.md`
- `docs/setup/CALENDLY.md`
