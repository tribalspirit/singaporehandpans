# Storyblok Automation - Quick Start Guide

## ⚡ 60-Second Setup

### 1. Get Tokens (2 minutes)
```bash
# Storyblok → Account Settings → Personal Access Tokens
# Create token with "All Spaces" permission
# Copy the management token (starts with sb-management-)
```

### 2. Add to .env (30 seconds)
```bash
STORYBLOK_TOKEN=your_preview_token_here
STORYBLOK_SPACE_ID=your_space_id_here
STORYBLOK_MANAGEMENT_TOKEN=your_management_token_here
```

### 3. Run Automation (30 seconds)
```bash
npm run storyblok:setup     # Creates all components & folders
npm run storyblok:content   # Creates sample content
```

## 🎯 What Gets Created

### Components (5 total)
- ✅ **Event** - Workshops, performances, gatherings
- ✅ **Workshop** - Course details, pricing, schedules  
- ✅ **Gallery Item** - Photos, videos with tags
- ✅ **Page** - About pages, policies, general content
- ✅ **Text Block** - Reusable content sections

### Content Folders (4 total)
- ✅ **Events** - Workshop listings and community events
- ✅ **Workshops** - Course descriptions and pricing
- ✅ **Gallery** - Photo and video management
- ✅ **Pages** - General content and information

### Sample Content (6+ items)
- ✅ **Events**: Beginner workshop, community gathering
- ✅ **Workshops**: Beginner course with pricing
- ✅ **Gallery**: Studio photos and workshop sessions
- ✅ **Pages**: About page with studio story

## 🔧 Available Commands

```bash
# Full setup (recommended for first run)
npm run storyblok:setup

# Individual components
npm run storyblok:components event
npm run storyblok:components all

# Sample content
npm run storyblok:content
```

## 🛠️ Manual Alternative

If you prefer manual setup, use the component definitions in `storyblok/components/`:

1. **Copy component schema** from JSON files
2. **Create manually** in Storyblok interface  
3. **Paste field definitions** from our schemas

## 🔍 Verification

After running automation, check your Storyblok space:

- [ ] **Components tab**: 5 new components created
- [ ] **Content tab**: 4 folders with sample content
- [ ] **Visual editor**: Working preview with components
- [ ] **API**: Content accessible via preview token

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Management token not found" | Add `STORYBLOK_MANAGEMENT_TOKEN` to .env |
| "Component already exists" | ✅ Normal - script updates existing |
| "API Error 401" | Check token permissions in Storyblok |
| "Space ID not found" | Add `STORYBLOK_SPACE_ID` to .env |

## 🎵 Next Steps

1. **Visit Storyblok** → See your new components
2. **Add images** → Upload photos to gallery items  
3. **Customize content** → Edit sample content to match your studio
4. **Test preview** → Run `npm run dev` to see content
5. **Go live** → Push to Cloudflare Pages

## 📊 Benefits

- ⚡ **5-minute setup** vs hours of manual work
- 🔄 **Repeatable** - safe to run multiple times
- 🎯 **Production-ready** - SEO optimized schemas
- 👥 **Team-friendly** - non-technical editing
- 🚀 **Scalable** - easy to add more components

**Total time saved**: 2-3 hours of manual Storyblok configuration! 🎉

