# Singapore Handpan Studio

A modern, responsive website for Singapore Handpan Studio built with Astro, TypeScript, and SCSS.

## 🎵 About

Singapore Handpan Studio is dedicated to sharing the healing sounds of handpan music through workshops, events, and community gatherings in Singapore. This website showcases our offerings and provides easy booking for workshops and private sessions.

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:4321
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Cloudflare Pages Deployment

```bash
# Standard build (Cloudflare Pages uses this automatically)
npm run build

# Preview locally
npm run preview
```

## 🛠️ Tech Stack

- **Framework**: [Astro](https://astro.build/) - Static Site Generator
- **Frontend**: React (for interactive components)
- **Styling**: SCSS + CSS Modules with design tokens
- **CMS**: [Storyblok](https://www.storyblok.com/) (headless CMS)
- **Language**: TypeScript (strict mode)
- **Deployment**: Cloudflare Pages with Git integration
- **Code Quality**: ESLint + Prettier

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── storyblok/      # Storyblok CMS components
│   ├── Header.astro    # Site navigation
│   ├── Footer.astro    # Site footer
│   └── SEO.astro       # SEO meta tags
├── layouts/            # Page layouts
│   └── BaseLayout.astro
├── pages/              # Route pages
│   ├── index.astro     # Home page
│   ├── about.astro     # About page
│   ├── workshops.astro # Workshops page
│   └── contacts.astro  # Contact page
├── styles/             # Global styles
│   ├── tokens.scss     # Design tokens
│   └── global.scss     # Base styles
└── utils/              # Utility functions
```

## 🎨 Features

- **Responsive Design**: Mobile-first approach with fluid typography
- **SEO Optimized**: Meta tags, Open Graph, JSON-LD structured data
- **Accessibility**: WCAG compliant with keyboard navigation
- **Performance**: Static site generation for fast loading
- **CMS Integration**: Content management via Storyblok
- **Modern CSS**: CSS variables, container queries, logical properties
- **Type Safety**: Full TypeScript integration

## 🚀 Deployment

This site is configured for automatic deployment to Cloudflare Pages. See [CLOUDFLARE-DEPLOYMENT.md](./CLOUDFLARE-DEPLOYMENT.md) for detailed setup instructions.

### Automated CI/CD

- **Trigger**: Push to any branch (main = production, others = preview)
- **Build**: Astro static site generation on Cloudflare's network
- **Deploy**: Cloudflare Pages with global CDN
- **Live**: Available at https://singaporehandpans.com

## 🔧 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run build:gh-pages # Build for GitHub Pages
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format code with Prettier
npm run deploy       # Build for GitHub Pages deployment
```

## 🌐 Environment Variables

### Quick Setup

```bash
# 1. Copy the example file
cp .env.example .env

# 2. Edit .env with your Storyblok token
# Get token from: Storyblok Space Settings > Access Tokens > Preview Token
```

### Required Variables

```bash
# Essential for Storyblok integration
STORYBLOK_TOKEN=your_storyblok_preview_token_here
NODE_ENV=development
PUBLIC_SITE_URL=http://localhost:4321
```

See [ENV-SETUP.md](./ENV-SETUP.md) for complete environment configuration guide.

## 📋 Content Management

The site uses Storyblok as a headless CMS for:
- Event listings and details
- Gallery images with tags
- Workshop information
- Studio content and team info

### 📚 Documentation
- **[STORYBLOK-SETUP.md](./STORYBLOK-SETUP.md)** - Complete setup guide
- **[STORYBLOK-AUTOMATION.md](./STORYBLOK-AUTOMATION.md)** - Automated content creation  
- **[STORYBLOK-ENV-FIX.md](./STORYBLOK-ENV-FIX.md)** - Environment variable troubleshooting

### ✅ Quick Verification
Visit `/events` page and check browser console for:
```
✅ Successfully fetched X events from Storyblok
```

Content models are configured in `astro.config.mjs` and components are in `src/components/storyblok/`.

## 📅 Booking Integration

The site includes Calendly integration for workshop and session bookings:

### Quick Setup (5 minutes)
- **[CALENDLY-QUICKSTART.md](./CALENDLY-QUICKSTART.md)** - Fast setup guide
- **[CALENDLY-SETUP.md](./CALENDLY-SETUP.md)** - Complete configuration guide

### Features
- ✅ Embedded booking widget on contacts page
- ✅ Direct booking buttons on events
- ✅ Multiple booking types (workshop, private, group)
- ✅ Branded styling with studio colors
- ✅ Mobile-responsive design
- ✅ Environment variable configuration

### Configuration
Add to your `.env` file:
```bash
PUBLIC_CALENDLY_WORKSHOP_URL=https://calendly.com/your-username/workshop
PUBLIC_CALENDLY_PRIVATE_URL=https://calendly.com/your-username/private-session
```

## 🎯 Pages

- **Home** (`/`) - Hero, about preview, services overview
- **About** (`/about`) - Studio story, mission, team, location
- **Workshops** (`/workshops`) - Course levels, pricing, scheduling
- **Contacts** (`/contacts`) - Contact info, booking, FAQ

## 🔍 SEO & Analytics

- Sitemap: `/sitemap.xml`
- Robots: `/robots.txt`
- Meta tags: Title, description, Open Graph, Twitter Cards
- JSON-LD: Organization and LocalBusiness schema
- Ready for Google Analytics integration

## 🐛 Development & Debugging

The project includes comprehensive debugging support:

### Source Maps Enabled
- ✅ **TypeScript/JavaScript** source maps for debugging
- ✅ **SCSS/CSS** source maps for style debugging  
- ✅ **Astro component** debugging support
- ✅ **Browser DevTools** integration

### Quick Setup
```bash
npm run dev  # Source maps auto-enabled in development
```

### Documentation
- **[DEBUGGING-SETUP.md](./DEBUGGING-SETUP.md)** - Complete debugging guide
- Includes browser setup, VS Code integration, mobile debugging
- Performance profiling and troubleshooting tips

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is proprietary to Singapore Handpan Studio.

## 📞 Support

For technical issues or questions about the website, please contact the development team.

For studio inquiries, visit [/contacts](/contacts) or email hello@sghandpan.com.