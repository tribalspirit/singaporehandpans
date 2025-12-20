# 📅 Calendly Quick Setup - 5 Minutes

Quick reference for setting up Calendly integration with Singapore Handpan Studio.

## 🚀 Step 1: Create Calendly Account (2 minutes)

1. **Go to** [calendly.com](https://calendly.com) and sign up
2. **Choose username**: `singaporehandpan` (or your preference)
3. **Create these event types**:
   - `workshop` → Handpan Workshop (2 hours)
   - `private-session` → Private Session (1 hour)
   - `group-session` → Group Session (1.5 hours) *optional*

## 🔧 Step 2: Add to .env File (1 minute)

Create `.env` file with these variables:

```bash
# Calendly Configuration - UPDATE THESE URLS
PUBLIC_CALENDLY_USERNAME=your_username_here
PUBLIC_CALENDLY_WORKSHOP_URL=https://calendly.com/your_username_here/workshop
PUBLIC_CALENDLY_PRIVATE_URL=https://calendly.com/your_username_here/private-session

# Customization (Optional)
PUBLIC_CALENDLY_PRIMARY_COLOR=D4A574
PUBLIC_CALENDLY_TEXT_COLOR=2C3E50
```

## ✅ Step 3: Test Integration (2 minutes)

```bash
# Start development server
npm run dev

# Test these pages:
# 1. http://localhost:4321/contacts - See Calendly widget
# 2. http://localhost:4321/events - See booking buttons
```

## 📋 Complete .env Template

**Copy this entire block to your .env file:**

```bash
# Singapore Handpan Studio - Environment Variables

# Storyblok CMS
STORYBLOK_TOKEN=your_storyblok_preview_token_here
STORYBLOK_SPACE_ID=your_space_id_here

# Basic Settings
NODE_ENV=development
PUBLIC_SITE_URL=http://localhost:4321
PUBLIC_SITE_NAME="Singapore Handpan Studio"

# Calendly Booking (REQUIRED - Update with your URLs)
PUBLIC_CALENDLY_USERNAME=singaporehandpan
PUBLIC_CALENDLY_WORKSHOP_URL=https://calendly.com/singaporehandpan/workshop
PUBLIC_CALENDLY_PRIVATE_URL=https://calendly.com/singaporehandpan/private-session
PUBLIC_CALENDLY_GROUP_SESSION_URL=https://calendly.com/singaporehandpan/group-session
PUBLIC_CALENDLY_DEFAULT_URL=https://calendly.com/singaporehandpan

# Calendly Styling
PUBLIC_CALENDLY_PRIMARY_COLOR=D4A574
PUBLIC_CALENDLY_TEXT_COLOR=2C3E50
PUBLIC_CALENDLY_HIDE_EVENT_TYPE_DETAILS=false
PUBLIC_CALENDLY_HIDE_LANDING_PAGE_DETAILS=true

# Contact Information
PUBLIC_CONTACT_EMAIL=hello@singaporehandpans.com
PUBLIC_STUDIO_PHONE=+65 9123 4567
PUBLIC_WHATSAPP_NUMBER=6591234567

# Social Media (Optional)
PUBLIC_FACEBOOK_HANDLE=singaporehandpan
PUBLIC_INSTAGRAM_HANDLE=singaporehandpan

# Analytics (Optional)
PUBLIC_GA4_ID=G-XXXXXXXXXX
```

## 🎯 What This Enables

✅ **Booking buttons** on events pages  
✅ **Calendly widget** embedded on contacts page  
✅ **Branded colors** matching your studio theme  
✅ **Multiple booking types** (workshop, private, group)  
✅ **Mobile-responsive** booking experience  
✅ **Fallback URLs** when environment variables aren't set  

## 🚀 Production Setup

For Cloudflare Pages, add these environment variables:

| Variable | Value |
|----------|-------|
| `PUBLIC_CALENDLY_USERNAME` | `your_calendly_username` |
| `PUBLIC_CALENDLY_WORKSHOP_URL` | `https://calendly.com/your_username/workshop` |
| `PUBLIC_CALENDLY_PRIVATE_URL` | `https://calendly.com/your_username/private-session` |

## 🆘 Troubleshooting

**Calendly widget not loading?**
- Check your `.env` file exists and has correct URLs
- Verify event URLs work when visited directly
- Restart development server after `.env` changes

**Booking button shows 404?**
- Ensure Calendly events are published and available
- Check spelling of event slugs in URLs
- Test URLs directly in browser

**Need detailed setup?**
- See `CALENDLY-SETUP.md` for complete configuration guide
- Includes email templates, advanced settings, and best practices

---

**Ready in 5 minutes!** 🎵✨

