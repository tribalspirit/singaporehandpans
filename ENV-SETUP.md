# Environment Variables Setup Guide

This guide explains how to set up environment variables for the Singapore Handpan Studio website with Storyblok CMS integration.

## 🚀 Quick Setup (2 minutes)

### 1. Create Your .env File

```bash
# Copy the example file
cp .env.example .env

# The .env file is already protected by .gitignore
```

### 2. Fill in Required Variables

**Minimum required for Storyblok integration:**

```bash
# Essential Storyblok configuration
STORYBLOK_TOKEN=your_storyblok_preview_token_here
NODE_ENV=development
PUBLIC_SITE_URL=http://localhost:4321
```

### 3. Get Your Storyblok Token

1. **Sign up** for [Storyblok](https://app.storyblok.com/#!/signup)
2. **Create a new space** for Singapore Handpan Studio
3. **Go to Settings** → **Access Tokens**
4. **Copy the Preview Token** (starts with `sb-preview-`)
5. **Paste it** in your `.env` file as `STORYBLOK_TOKEN`

## 📋 Environment Variables Reference

### 🔧 Essential Variables (Required)

| Variable | Purpose | Example Value |
|----------|---------|---------------|
| `STORYBLOK_TOKEN` | Storyblok API access | `sb-preview-123abc...` |
| `NODE_ENV` | Build environment | `development` |
| `PUBLIC_SITE_URL` | Site URL for Astro | `http://localhost:4321` |

### 🌐 Content & CMS (Storyblok)

| Variable | Purpose | Example Value |
|----------|---------|---------------|
| `STORYBLOK_PUBLIC_TOKEN` | Published content only | `sb-public-456def...` |
| `STORYBLOK_SPACE_ID` | Space ID for API calls | `123456` |
| `STORYBLOK_REGION` | API region | `eu` or `us` |
| `STORYBLOK_BRIDGE_ENABLED` | Visual editor in dev | `true` |

### 📊 Analytics & Tracking (Optional)

| Variable | Purpose | How to Get |
|----------|---------|------------|
| `PUBLIC_GA4_ID` | Google Analytics 4 | [GA4 Setup](https://analytics.google.com/) |
| `PUBLIC_GTM_ID` | Google Tag Manager | [GTM Setup](https://tagmanager.google.com/) |
| `PUBLIC_FACEBOOK_PIXEL_ID` | Facebook tracking | [Facebook Business](https://business.facebook.com/) |
| `PUBLIC_HOTJAR_ID` | User behavior analytics | [Hotjar](https://www.hotjar.com/) |

### 📅 Booking Integration (Optional)

| Variable | Purpose | Example Value |
|----------|---------|---------------|
| `PUBLIC_CALENDLY_USERNAME` | Calendly integration | `singaporehandpan` |
| `PUBLIC_CALENDLY_WORKSHOP_EVENT` | Workshop booking | `workshop-booking` |
| `PUBLIC_CALENDLY_PRIVATE_EVENT` | Private session booking | `private-session` |

### 📧 Email & Forms (Optional)

| Variable | Purpose | Service |
|----------|---------|---------|
| `MAILGUN_API_KEY` | Transactional emails | [Mailgun](https://www.mailgun.com/) |
| `SENDGRID_API_KEY` | Alternative email service | [SendGrid](https://sendgrid.com/) |
| `RESEND_API_KEY` | Modern email API | [Resend](https://resend.com/) |

### 💳 Payments (Optional)

| Variable | Purpose | Service |
|----------|---------|---------|
| `STRIPE_PUBLIC_KEY` | Workshop payments | [Stripe](https://stripe.com/) |
| `PAYPAL_CLIENT_ID` | Alternative payments | [PayPal](https://developer.paypal.com/) |

## 🔒 Security Best Practices

### ✅ Do This
- **Keep .env files local** - never commit to git
- **Use different tokens** for development and production
- **Rotate tokens regularly** (every 90 days)
- **Use PUBLIC_ prefix** only for frontend-safe variables
- **Keep production secrets** in Cloudflare Pages environment variables

### ❌ Don't Do This
- **Never commit .env** to version control
- **Don't share tokens** via chat/email
- **Don't use production tokens** in development
- **Don't expose secrets** in frontend code (without PUBLIC_ prefix)

## 🌍 Environment-Specific Configuration

### Development (.env)
```bash
NODE_ENV=development
PUBLIC_SITE_URL=http://localhost:4321
STORYBLOK_TOKEN=sb-preview-dev-token...
DEBUG=true
PUBLIC_DISABLE_ANALYTICS=true
```

### Production (Cloudflare Pages)
```bash
NODE_ENV=production
PUBLIC_SITE_URL=https://singaporehandpans.com
STORYBLOK_TOKEN=sb-preview-prod-token...
DEBUG=false
# Analytics enabled by default
```

## 🚀 Cloudflare Pages Setup

### Adding Environment Variables

1. **Go to your Pages project** in Cloudflare Dashboard
2. **Settings** → **Environment variables**
3. **Add variables** for production:

| Variable | Value | Environment |
|----------|-------|-------------|
| `STORYBLOK_TOKEN` | Your production preview token | Production |
| `NODE_ENV` | `production` | Production |
| `PUBLIC_GA4_ID` | Your GA4 ID | Production |

### Production vs Preview

- **Production branch (main)**: Uses production environment variables
- **Preview branches**: Can use different variables for testing

## 🔧 Storyblok Space Configuration

### Content Types Needed

Based on your website structure, create these content types in Storyblok:

1. **Event** - For workshops and community events
   - Title, description, date, location, booking URL
   
2. **Gallery Item** - For photo/video gallery
   - Image/video, title, description, tags
   
3. **Workshop** - For workshop information
   - Title, description, duration, price, skill level
   
4. **Page** - For general content pages
   - Title, content blocks, SEO fields

### Content Structure
```
Content/
├── Events/
│   ├── handpan-basics-workshop
│   ├── community-gathering-march
│   └── private-session-booking
├── Gallery/
│   ├── workshop-photos-2024
│   ├── handpan-collection
│   └── studio-ambiance
├── Workshops/
│   ├── beginner-workshop
│   ├── intermediate-workshop
│   └── advanced-workshop
└── Pages/
    ├── about-us
    ├── studio-story
    └── contact-info
```

## 🛠️ Development Workflow

### 1. Start Development

```bash
# Ensure .env is configured
cp .env.example .env
# Edit .env with your values

# Start development server
npm run dev
```

### 2. Test Storyblok Integration

1. **Create test content** in Storyblok
2. **Preview in development** at http://localhost:4321
3. **Test visual editor** (if bridge enabled)

### 3. Deploy to Production

```bash
# Commit code (without .env)
git add .
git commit -m "Add Storyblok integration"
git push origin main

# Configure production environment variables in Cloudflare Pages
```

## 📚 Additional Resources

- **Storyblok Docs**: [storyblok.com/docs](https://www.storyblok.com/docs)
- **Astro Environment Variables**: [docs.astro.build/en/guides/environment-variables](https://docs.astro.build/en/guides/environment-variables/)
- **Cloudflare Pages Environment Variables**: [developers.cloudflare.com/pages/platform/build-configuration#environment-variables](https://developers.cloudflare.com/pages/platform/build-configuration#environment-variables)

## 🆘 Troubleshooting

### Common Issues

**"STORYBLOK_TOKEN not found"**
- Ensure token is in .env file
- Check token format (starts with `sb-preview-` or `sb-public-`)
- Verify space permissions

**"Build fails in production"**
- Add environment variables in Cloudflare Pages
- Check token permissions and expiry
- Verify NODE_ENV is set correctly

**"Content not loading"**
- Check Storyblok space is published
- Verify API region (eu/us) matches your space
- Test token with Storyblok API directly

## 🎯 Next Steps

1. **Set up your .env file** with Storyblok token
2. **Create Storyblok content types** for events, workshops, gallery
3. **Add sample content** in Storyblok
4. **Test local development** with npm run dev
5. **Configure production** environment variables in Cloudflare Pages

You're ready to integrate dynamic content management! 🎵
