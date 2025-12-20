# Environment Setup Guide

Complete guide for setting up your development environment for Singapore Handpan Studio.

## Prerequisites

- Node.js 18+ and npm
- Git
- A code editor (VS Code recommended)
- Storyblok account (free tier available)

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the project root:

```bash
# Storyblok CMS
STORYBLOK_TOKEN=your_preview_token_here
STORYBLOK_MANAGEMENT_TOKEN=your_management_token_here
STORYBLOK_SPACE_ID=your_space_id_here

# Site Configuration
NODE_ENV=development
PUBLIC_SITE_URL=http://localhost:4321

# Calendly Integration (Optional)
PUBLIC_CALENDLY_EVENT_URL=https://calendly.com/your-username/event
PUBLIC_CALENDLY_PRIVATE_URL=https://calendly.com/your-username/private-session
```

### 3. Get Your Storyblok Tokens

#### Preview Token (Required for development)
1. Go to [Storyblok](https://app.storyblok.com/)
2. Select your space
3. Navigate to **Settings** → **Access Tokens**
4. Copy the **Preview** token
5. Add to `.env` as `STORYBLOK_TOKEN`

#### Management Token (Required for automation scripts)
1. Go to [Storyblok Account Settings](https://app.storyblok.com/#!/me/account?tab=token)
2. Click **Generate new token**
3. Name it (e.g., "CLI Automation")
4. Copy the token immediately (shown only once!)
5. Add to `.env` as `STORYBLOK_MANAGEMENT_TOKEN`

#### Space ID
1. In Storyblok, go to **Settings** → **General**
2. Copy the **Space ID** (numeric)
3. Add to `.env` as `STORYBLOK_SPACE_ID`

## Running the Development Server

```bash
npm run dev
```

Your site will be available at `http://localhost:4321`

## Verify Setup

1. Start the dev server
2. Visit `http://localhost:4321`
3. Check browser console - should see no errors
4. Visit `/events` - should load events from Storyblok

## Troubleshooting

### "STORYBLOK_TOKEN not found"
- Ensure `.env` file exists in project root
- Verify token is copied correctly (no extra spaces)
- Restart dev server after adding `.env`

### "Failed to fetch from Storyblok"
- Verify tokens are correct
- Check Space ID matches your space
- Ensure you're using the Preview token, not Published token
- Check network connection

### Build Errors
```bash
# Clear cache and rebuild
rm -rf node_modules dist .astro
npm install
npm run build
```

## Next Steps

- [Setup Storyblok CMS](./STORYBLOK.md)
- [Configure Calendly](./CALENDLY.md)
- [Setup Deployment](../deployment/CLOUDFLARE.md)

