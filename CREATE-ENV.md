# How to Create Your .env File

Since the .env file is protected for security reasons, you need to create it manually. Here's how:

## 📋 Method 1: Copy from Example

### Windows (PowerShell)
```powershell
# Copy the example file
Copy-Item .env.example .env

# Edit with your favorite editor
notepad .env
# or
code .env
```

### macOS/Linux (Terminal)
```bash
# Copy the example file
cp .env.example .env

# Edit with your favorite editor
nano .env
# or
vim .env
# or
code .env
```

## 📋 Method 2: Create Manually

Create a new file called `.env` in the project root with this content:

```bash
# Singapore Handpan Studio - Environment Variables

# Storyblok CMS Configuration
STORYBLOK_TOKEN=your_storyblok_preview_token_here
STORYBLOK_SPACE_ID=your_space_id_here

# Development Settings
NODE_ENV=development
PUBLIC_SITE_URL=http://localhost:4321
PUBLIC_SITE_NAME="Singapore Handpan Studio"

# Optional - Analytics
PUBLIC_GA4_ID=your_ga4_id_here
PUBLIC_GTM_ID=your_gtm_id_here

# Optional - Social Media
PUBLIC_FACEBOOK_HANDLE=singaporehandpan
PUBLIC_INSTAGRAM_HANDLE=singaporehandpan

# Calendly Booking Integration (Required for booking functionality)
PUBLIC_CALENDLY_USERNAME=singaporehandpan
PUBLIC_CALENDLY_WORKSHOP_URL=https://calendly.com/singaporehandpan/workshop
PUBLIC_CALENDLY_PRIVATE_URL=https://calendly.com/singaporehandpan/private-session
PUBLIC_CALENDLY_GROUP_SESSION_URL=https://calendly.com/singaporehandpan/group-session
PUBLIC_CALENDLY_DEFAULT_URL=https://calendly.com/singaporehandpan

# Calendly Customization
PUBLIC_CALENDLY_PRIMARY_COLOR=D4A574
PUBLIC_CALENDLY_TEXT_COLOR=2C3E50
PUBLIC_CALENDLY_HIDE_EVENT_TYPE_DETAILS=false
PUBLIC_CALENDLY_HIDE_LANDING_PAGE_DETAILS=true

# Optional - Contact Info
PUBLIC_CONTACT_EMAIL=hello@singaporehandpans.com
PUBLIC_STUDIO_ADDRESS="123 Music Street, Level 2, Singapore 123456"
```

## 🔑 Getting Your Storyblok Token

1. **Sign up** at [Storyblok](https://app.storyblok.com/#!/signup)
2. **Create a new space** for Singapore Handpan Studio
3. **Navigate to**: Settings → Access Tokens
4. **Copy the Preview Token** (starts with `sb-preview-`)
5. **Replace** `your_storyblok_preview_token_here` with your actual token

## ✅ Verification

After creating your .env file:

1. **Check file exists**: The .env file should be in your project root
2. **Verify .gitignore**: The .env file should NOT appear in git status
3. **Test development**: Run `npm run dev` to test the integration

## 🔒 Security Reminder

- ✅ The .env file is already protected by .gitignore
- ✅ Never commit .env to version control
- ✅ Keep your Storyblok tokens secure
- ✅ Use different tokens for development and production

## 🎯 Next Steps

After creating your .env file:

1. **Add your Storyblok token**
2. **Start development**: `npm run dev`
3. **Create Storyblok content** (see STORYBLOK-SETUP.md)
4. **Test the integration**

You're ready to integrate Storyblok! 🚀
