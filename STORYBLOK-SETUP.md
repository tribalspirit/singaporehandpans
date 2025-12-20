# Storyblok Integration Setup Guide

## 🚀 Quick Start (5 minutes)

### 1. Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your Storyblok token
STORYBLOK_TOKEN=your_preview_token_here
```

### 2. Get Storyblok Token

1. **Sign up** at [Storyblok](https://app.storyblok.com/#!/signup)
2. **Create a new space** for Singapore Handpan Studio
3. **Go to Settings** → **Access Tokens** 
4. **Copy Preview Token** (starts with `sb-preview-`)
5. **Paste in .env** file

### 3. Start Development

```bash
npm run dev
# Visit http://localhost:4321
```

## 📋 Storyblok Content Types to Create

### 1. Event Content Type

**Fields to add:**
- `title` (Text) - Event title
- `description` (Textarea) - Event description  
- `date` (Date) - Event date and time
- `location` (Text) - Event location
- `price` (Text) - Event price
- `booking_url` (Text) - Calendly or booking link
- `image` (Asset) - Event featured image
- `tags` (Multi-Options) - Event categories
- `status` (Single-Option) - upcoming, past, cancelled

### 2. Gallery Item Content Type

**Fields to add:**
- `title` (Text) - Image/video title
- `media` (Asset) - Image or video file
- `description` (Textarea) - Media description
- `tags` (Multi-Options) - Categories (workshop, instruments, studio, etc.)
- `date_taken` (Date) - When photo/video was taken
- `featured` (Boolean) - Show on homepage

### 3. Workshop Content Type

**Fields to add:**
- `title` (Text) - Workshop name
- `description` (Rich Text) - Full description
- `duration` (Text) - Workshop length
- `price` (Text) - Workshop price  
- `skill_level` (Single-Option) - beginner, intermediate, advanced
- `max_participants` (Number) - Class size limit
- `image` (Asset) - Workshop image
- `booking_link` (Text) - Calendly URL
- `featured` (Boolean) - Show prominently

### 4. Page Content Type

**Fields to add:**
- `title` (Text) - Page title
- `content` (Rich Text) - Page content
- `seo_title` (Text) - SEO title override
- `seo_description` (Textarea) - SEO description
- `featured_image` (Asset) - Page hero image
- `published` (Boolean) - Page visibility

## 🔧 Component Integration

Your Astro components are already configured in `astro.config.mjs`:

```javascript
components: {
  event: 'src/components/storyblok/Event',
  gallery_item: 'src/components/storyblok/GalleryItem',
  workshop: 'src/components/storyblok/Workshop', 
  page: 'src/components/storyblok/Page',
}
```

## 📄 Sample Content

### Sample Event
```json
{
  "title": "Beginner Handpan Workshop",
  "description": "Learn the basics of handpan playing in our welcoming studio environment.",
  "date": "2024-02-15T19:00:00.000Z",
  "location": "Singapore Handpan Studio",
  "price": "S$120",
  "booking_url": "https://calendly.com/singaporehandpan/workshop",
  "tags": ["workshop", "beginner"],
  "status": "upcoming"
}
```

### Sample Gallery Item
```json
{
  "title": "Handpan Collection",
  "description": "Our beautiful collection of handpan instruments",
  "tags": ["instruments", "studio"],
  "featured": true
}
```

## 🌐 Production Setup

### Cloudflare Pages Environment Variables

Add these in your Cloudflare Pages project settings:

```
STORYBLOK_TOKEN = your_production_preview_token
NODE_ENV = production
```

### Webhooks (Optional)

To auto-rebuild on content changes:

1. **Storyblok Settings** → **Webhooks**
2. **Create webhook** with Cloudflare Pages build URL
3. **Trigger on**: Published, Unpublished

## 🔍 Testing Integration

### 1. Create Test Content

Create a test event in Storyblok with all fields filled.

### 2. Test Locally

```bash
npm run dev
# Check if content appears on relevant pages
```

### 3. Test Visual Editor

The visual editor should work automatically when:
- Running in development mode
- Logged into Storyblok
- Viewing pages with Storyblok content

## 🆘 Troubleshooting

### Common Issues

**"Storyblok content not loading"**
- Check STORYBLOK_TOKEN in .env
- Verify token has correct permissions
- Ensure content is published in Storyblok

**"Visual editor not working"**
- Check if logged into Storyblok
- Verify bridge is enabled in development
- Clear browser cache

**"Build fails in production"**
- Add environment variables in Cloudflare Pages
- Check token expiry date
- Verify space has content published

## 🎯 Next Steps

1. ✅ Set up environment variables
2. ✅ Create Storyblok space and content types
3. ✅ Add sample content
4. ✅ Test local development
5. ✅ Configure production environment
6. ✅ Set up webhooks for auto-rebuild

You're ready for dynamic content management! 🎵

