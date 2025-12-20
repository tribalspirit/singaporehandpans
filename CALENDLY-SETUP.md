# 📅 Calendly Integration Setup Guide

This guide will walk you through setting up Calendly integration for Singapore Handpan Studio website, enabling visitors to book workshops, private sessions, and community events directly through your website.

## 🚀 Quick Start (5 minutes)

### 1. Create Your Calendly Account

1. **Sign up** at [calendly.com](https://calendly.com)
2. **Choose username**: `singaporehandpan` (or your preferred name)
3. **Complete your profile** with studio information

### 2. Add Calendly URLs to Your .env File

Create or update your `.env` file with these variables:

```bash
# Calendly Configuration
PUBLIC_CALENDLY_USERNAME=singaporehandpan
PUBLIC_CALENDLY_WORKSHOP_URL=https://calendly.com/singaporehandpan/workshop
PUBLIC_CALENDLY_PRIVATE_URL=https://calendly.com/singaporehandpan/private-session
```

### 3. Test the Integration

```bash
# Start development server
npm run dev

# Visit the contacts page to see Calendly widget
# Visit events pages to see booking buttons
```

## 📋 Complete .env.example Template

Save this as `.env.example` in your project root:

```bash
# Singapore Handpan Studio - Environment Variables
# Copy this file to .env and fill in your actual values

# =============================================================================
# 🔧 ESSENTIAL CONFIGURATION (Required for basic functionality)
# =============================================================================

# Storyblok CMS Configuration
STORYBLOK_TOKEN=your_storyblok_preview_token_here
STORYBLOK_SPACE_ID=your_space_id_here

# Development Settings
NODE_ENV=development
PUBLIC_SITE_URL=http://localhost:4321
PUBLIC_SITE_NAME="Singapore Handpan Studio"

# =============================================================================
# 📅 CALENDLY BOOKING INTEGRATION (Required for booking functionality)
# =============================================================================

# Your Calendly username (the part after calendly.com/)
PUBLIC_CALENDLY_USERNAME=singaporehandpan

# Specific event URLs for different booking types
# Format: https://calendly.com/{username}/{event-slug}
PUBLIC_CALENDLY_WORKSHOP_URL=https://calendly.com/singaporehandpan/workshop
PUBLIC_CALENDLY_PRIVATE_URL=https://calendly.com/singaporehandpan/private-session
PUBLIC_CALENDLY_GROUP_SESSION_URL=https://calendly.com/singaporehandpan/group-session

# Default booking URL (fallback)
PUBLIC_CALENDLY_DEFAULT_URL=https://calendly.com/singaporehandpan

# Calendly embed customization
PUBLIC_CALENDLY_PRIMARY_COLOR=D4A574
PUBLIC_CALENDLY_TEXT_COLOR=2C3E50
PUBLIC_CALENDLY_HIDE_EVENT_TYPE_DETAILS=false
PUBLIC_CALENDLY_HIDE_LANDING_PAGE_DETAILS=true

# =============================================================================
# 📧 CONTACT INFORMATION
# =============================================================================

PUBLIC_CONTACT_EMAIL=hello@singaporehandpans.com
PUBLIC_STUDIO_PHONE=+65 9123 4567
PUBLIC_STUDIO_ADDRESS="123 Music Street, Level 2, Singapore 123456"
PUBLIC_WHATSAPP_NUMBER=6591234567

# =============================================================================
# 🌐 SOCIAL MEDIA INTEGRATION (Optional)
# =============================================================================

PUBLIC_FACEBOOK_HANDLE=singaporehandpan
PUBLIC_INSTAGRAM_HANDLE=singaporehandpan
PUBLIC_YOUTUBE_HANDLE=singaporehandpan

# =============================================================================
# 📊 ANALYTICS & TRACKING (Optional)
# =============================================================================

# Google Analytics 4
PUBLIC_GA4_ID=G-XXXXXXXXXX

# Google Tag Manager
PUBLIC_GTM_ID=GTM-XXXXXXX
```

## 📅 Setting Up Calendly Events

### 1. Create Event Types in Calendly

#### Workshop Booking Event
- **Event name**: "Handpan Workshop Booking"
- **URL**: `workshop` (becomes `/workshop`)
- **Duration**: 2 hours
- **Location**: Singapore Handpan Studio
- **Description**: Template provided below

#### Private Session Event
- **Event name**: "Private Handpan Session"
- **URL**: `private-session` (becomes `/private-session`)
- **Duration**: 1 hour
- **Location**: Singapore Handpan Studio
- **Pricing**: Enable if charging for sessions

#### Group Session Event (Optional)
- **Event name**: "Group Handpan Session"
- **URL**: `group-session`
- **Duration**: 1.5 hours
- **Max attendees**: 6 people

### 2. Event Description Templates

#### Workshop Description
```
🎵 Learn the Beautiful Art of Handpan Music

Join us for an immersive handpan workshop at Singapore Handpan Studio! Perfect for beginners and music lovers wanting to explore this meditative instrument.

What's Included:
✓ Introduction to handpan techniques
✓ Basic rhythm patterns and melodies  
✓ Instrument provided during session
✓ Small group setting (max 6 people)
✓ Refreshments and studio ambiance

Duration: 2 hours
Skill Level: All levels welcome
Location: Singapore Handpan Studio

What to Bring:
- Comfortable clothing
- Open mind and willingness to learn
- Water bottle (we provide light refreshments)

Questions? Contact us at hello@singaporehandpans.com or WhatsApp +65 9123 4567

We can't wait to share the healing sounds of handpan with you! 🎵
```

#### Private Session Description
```
🎵 Personal Handpan Lesson - One-on-One

Experience personalized handpan instruction tailored to your skill level and musical interests.

Session Includes:
✓ Customized lesson plan
✓ Individual attention and feedback
✓ Technique refinement
✓ Song learning (your choice)
✓ Practice guidance and exercises

Duration: 1 hour
Location: Singapore Handpan Studio
Skill Level: All levels (beginner to advanced)

Perfect For:
- Focused learning experience
- Addressing specific techniques
- Preparing for performances
- Flexible scheduling needs

What to Bring:
- Your own handpan (if you have one)
- Notebook for practice notes
- Recording device (optional, with permission)

Contact: hello@singaporehandpans.com | WhatsApp +65 9123 4567
```

### 3. Calendly Configuration

#### Availability Settings
- **Hours**: Set your studio operating hours
- **Buffer times**: 15 minutes between sessions
- **Date range**: 60 days in advance
- **Minimum notice**: 24 hours

#### Questions to Ask
1. **Experience Level** (Required)
   - Beginner (never played handpan)
   - Some experience (played before)
   - Intermediate (own handpan, learning songs)
   - Advanced (looking to refine technique)

2. **Musical Background** (Optional)
   - No musical experience
   - Some musical experience
   - Experienced musician

3. **Special Requests** (Optional)
   - Any specific songs or techniques you'd like to learn?

4. **Contact Information**
   - WhatsApp number (for session updates)

#### Confirmation Settings
- **Confirmation page**: Custom message with studio details
- **Email confirmation**: Include location, parking info, what to bring
- **Reminder emails**: 24 hours and 2 hours before

## 🎨 Customizing the Integration

### Color Scheme
Update your `.env` file to match your brand:

```bash
# Singapore Handpan Studio Brand Colors
PUBLIC_CALENDLY_PRIMARY_COLOR=D4A574  # Warm gold
PUBLIC_CALENDLY_TEXT_COLOR=2C3E50     # Dark blue-gray
```

### Advanced Configuration
```bash
# Hide event type details on embed
PUBLIC_CALENDLY_HIDE_EVENT_TYPE_DETAILS=true

# Hide Calendly landing page details
PUBLIC_CALENDLY_HIDE_LANDING_PAGE_DETAILS=true

# Default embed height
PUBLIC_CALENDLY_DEFAULT_HEIGHT=630px
```

## 🚀 Production Deployment

### Cloudflare Pages Environment Variables

Add these to your Cloudflare Pages environment variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `PUBLIC_CALENDLY_USERNAME` | `singaporehandpan` | Production |
| `PUBLIC_CALENDLY_WORKSHOP_URL` | `https://calendly.com/singaporehandpan/workshop` | Production |
| `PUBLIC_CALENDLY_PRIVATE_URL` | `https://calendly.com/singaporehandpan/private-session` | Production |
| `PUBLIC_CALENDLY_PRIMARY_COLOR` | `D4A574` | Production |
| `PUBLIC_CALENDLY_TEXT_COLOR` | `2C3E50` | Production |

### Testing Production Integration

1. **Deploy to Cloudflare Pages**
2. **Test booking flows** on your live site
3. **Verify email confirmations** are working
4. **Test calendar sync** with your Google Calendar

## 📱 Mobile Optimization

The Calendly integration is fully responsive and works on:
- ✅ Desktop browsers
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)
- ✅ Tablet devices

## 🔧 Troubleshooting

### Common Issues

#### "Calendly widget not loading"
- Check your `PUBLIC_CALENDLY_*` environment variables
- Verify URLs are correct and accessible
- Ensure JavaScript is enabled in browser

#### "Booking button shows 404"
- Verify event URLs exist in your Calendly account
- Check spelling of event slugs
- Ensure events are published and available

#### "Wrong time zone showing"
- Set your correct time zone in Calendly settings
- Verify location settings in Calendly account
- Check browser time zone settings

#### "Emails not sending"
- Verify email settings in Calendly account
- Check spam/junk folder
- Ensure email templates are configured

### Debug Mode

Enable debug logging in development:

```bash
# .env
DEBUG=true
VERBOSE_LOGGING=true
```

This will log Calendly integration details to the console.

## 📊 Analytics & Tracking

### Calendly Analytics
- Access booking analytics in your Calendly dashboard
- Track conversion rates and popular time slots
- Monitor no-show rates and cancellations

### Google Analytics Integration
Add this to track Calendly events:

```bash
# .env
PUBLIC_GA4_ID=G-XXXXXXXXXX
```

The integration automatically tracks:
- Calendly widget loads
- Booking button clicks
- Successful bookings (if GA4 configured)

## 🎯 Best Practices

### 1. Studio Preparation
- **Clear directions** to your studio in confirmations
- **Parking information** for visitors
- **Contact number** for day-of questions
- **Studio policies** (cancellation, rescheduling)

### 2. Email Templates
- **Welcome message** after booking
- **Reminder with details** 24 hours before
- **Follow-up** after session with practice tips

### 3. Calendar Management
- **Block personal time** in Calendly
- **Set realistic availability** considering setup/cleanup
- **Use buffer times** between different session types

### 4. Customer Experience
- **Respond quickly** to booking inquiries
- **Send confirmation** within 15 minutes
- **Provide clear expectations** about what to bring
- **Follow up** after sessions for feedback

## 🆘 Support & Resources

### Official Documentation
- **Calendly Help Center**: [help.calendly.com](https://help.calendly.com)
- **Calendly API Docs**: [developer.calendly.com](https://developer.calendly.com)

### Singapore Handpan Studio Support
- **Email**: hello@singaporehandpans.com
- **WhatsApp**: +65 9123 4567
- **Website Issues**: Check GitHub issues or contact developer

### Community Resources
- **Calendly Community**: Share experiences with other music instructors
- **Music Business Groups**: Learn booking best practices

## 🎵 Next Steps

1. **Set up your Calendly account** with the event types above
2. **Configure your .env file** with your Calendly URLs
3. **Test the booking flow** in development
4. **Deploy to production** with environment variables
5. **Monitor bookings** and refine your setup

Your handpan studio is now ready to accept bookings seamlessly! 🎵✨

---

*Last updated: December 2024 | For technical support, contact the development team*

