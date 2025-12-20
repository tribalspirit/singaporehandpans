# Storyblok Automation Guide

## 🚀 Automated Entity Creation

This project includes powerful automation scripts that can create all your Storyblok components, content types, and sample content automatically using the Storyblok Management API.

## 📋 Quick Setup (5 minutes)

### 1. Get Management API Token

1. **Login to Storyblok** → Go to [Account Settings](https://app.storyblok.com/#!/me/account)
2. **Personal Access Tokens** tab → Click **"Generate new token"**
3. **Name**: "Singapore Handpan Automation"
4. **Scopes**: Select **"All Spaces"** (or select your specific space)
5. **Copy the token** (starts with `sb-management-`)

### 2. Add Environment Variables

Add these to your `.env` file:

```bash
# Existing variables
STORYBLOK_TOKEN=your_preview_token_here
STORYBLOK_SPACE_ID=your_space_id_here

# New automation variables  
STORYBLOK_MANAGEMENT_TOKEN=your_management_token_here
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Full Setup

```bash
# Create all components and folders
npm run storyblok:setup

# Create sample content
npm run storyblok:content
```

**Done!** 🎉 Your Storyblok space is now fully configured.

## 🛠️ Available Scripts

### Full Setup
```bash
npm run storyblok:setup
```
Creates all components and content folders automatically.

### Individual Components
```bash
# Create a specific component
npm run storyblok:components event
npm run storyblok:components gallery_item
npm run storyblok:components page

# Create all components
npm run storyblok:components all
```

### Sample Content
```bash
npm run storyblok:content
```
Creates sample events, gallery items, and pages.

## 📦 Components Created

### 1. Event Component
**Perfect for**: Event listings, workshops, performances, community gatherings

**Fields**:
- Title, description, date, location, price
- Booking URL (Calendly integration)
- Featured image, tags, status (upcoming/past/cancelled)
- Max participants, SEO fields

### 2. Gallery Item Component
**Perfect for**: Photos, videos, media management

**Fields**:
- Title, media file, description
- Tags for categorization
- Featured flag, sort order
- Photographer credit, alt text

### 3. Page Component
**Perfect for**: About pages, policies, general content

**Fields**:
- Title, rich text content
- Content sections (using blocks)
- SEO optimization fields
- Menu integration, publishing controls

### 4. Text Block Component
**Perfect for**: Reusable content sections

**Fields**:
- Rich text content
- Style options (default, large, highlighted, quote)

## 📁 Content Structure Created

```
Content/
├── Events/
│   ├── Beginner Handpan Workshop
│   ├── Community Handpan Gathering
│   └── Intermediate Rhythms Workshop
├── Gallery/
│   ├── Handpan Collection Display
│   └── Event in Session
└── Pages/
    └── About Singapore Handpan Studio
```

## 🔧 Manual Component Management

### Component Definition Files

Located in `storyblok/components/`:

- `event.json` - Event component schema
- `gallery_item.json` - Gallery item component schema
- `page.json` - Page component schema
- `text_block.json` - Text block component schema

### Customizing Components

1. **Edit JSON files** in `storyblok/components/`
2. **Run update script**: `npm run storyblok:components <component_name>`
3. **Components are updated** in Storyblok automatically

Example: Adding a new field to events:

```json
{
  "instructor": {
    "type": "text", 
    "pos": 12,
    "required": false,
    "description": "Workshop instructor name"
  }
}
```

Then run: `npm run storyblok:components event`

## 🎯 Sample Content Details

### Events Created
- **Beginner Handpan Workshop** - Introductory workshop with booking
- **Community Gathering** - Free community event
- **Intermediate Rhythms Workshop** - Advanced workshop

### Gallery Items Created
- **Handpan Collection** - Studio instrument showcase
- **Event Session** - Students learning

### Pages Created
- **About Page** - Studio story and mission

## 🔍 Troubleshooting

### "Management token not found"
- Check `.env` file has `STORYBLOK_MANAGEMENT_TOKEN`
- Verify token starts with `sb-management-`
- Ensure token has correct permissions

### "Space ID not found"  
- Add `STORYBLOK_SPACE_ID` to `.env`
- Get Space ID from Storyblok Settings → General

### "Component already exists"
- Script automatically updates existing components
- Safe to run multiple times

### "API Error 401"
- Check management token permissions
- Verify space access in token settings

### "API Error 422"
- Component validation error
- Check JSON schema syntax in component files

## 🔄 Updating Components

The automation scripts are **safe to run multiple times**:

- **New components**: Created automatically
- **Existing components**: Updated with new schema
- **No data loss**: Existing content preserved

## 🌐 Production Deployment

### Cloudflare Pages Environment

Add these environment variables in Cloudflare Pages:

```
STORYBLOK_TOKEN = your_production_preview_token
STORYBLOK_SPACE_ID = your_space_id  
NODE_ENV = production
```

**Note**: Don't add management token to production (security risk)

### Webhook Setup (Optional)

For automatic rebuilds on content changes:

1. **Storyblok Settings** → **Webhooks**
2. **Add webhook** with Cloudflare Pages build URL
3. **Trigger on**: Published, Unpublished

## 🎵 Content Management Workflow

### 1. Initial Setup (One-time)
```bash
npm run storyblok:setup
npm run storyblok:content
```

### 2. Content Creation
- Use Storyblok visual editor
- Create new events, gallery items, pages
- Organize in folders
- **Important**: Upload images to events via Storyblok UI
- Set event status to "upcoming" and click Save

### 3. Schema Updates
- Edit JSON files in `storyblok/components/`  
- Run `npm run storyblok:components <name>`
- Components update automatically

### 4. Production Deployment
- Content changes trigger automatic rebuilds
- No manual deployment needed

## 📊 Advanced Features

### Webhook Integration
```javascript
// Example webhook handler for auto-rebuild
export async function POST({ request }) {
  const payload = await request.json();
  
  // Trigger Cloudflare Pages rebuild
  if (payload.action === 'published') {
    // Rebuild logic here
  }
}
```

### Content Validation
```javascript  
// Example content validation
const requiredFields = ['title', 'description', 'date'];
const isValid = requiredFields.every(field => content[field]);
```

### Custom Components
Add new components by:
1. Creating JSON schema in `storyblok/components/`
2. Adding to Astro config component mapping
3. Running automation script

## 🎉 Results

After running the automation:

- ✅ **4 Components** created and configured
- ✅ **3 Content folders** organized
- ✅ **6+ Sample content** items ready
- ✅ **SEO optimized** with meta fields
- ✅ **Production ready** for deployment
- ✅ **Scalable** content management system

Your Singapore Handpan Studio now has a **world-class content management system** that can be managed by non-technical team members! 🌟

## 📞 Support

If you encounter issues:

1. Check this documentation first
2. Verify API tokens and permissions  
3. Review Storyblok Management API docs
4. Check component JSON syntax

**Remember**: The automation is designed to be **safe and repeatable** - run scripts as many times as needed!

