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

### GitHub Pages Deployment

```bash
# Build optimized for GitHub Pages
npm run build:gh-pages

# Or use the deploy alias
npm run deploy
```

## 🛠️ Tech Stack

- **Framework**: [Astro](https://astro.build/) - Static Site Generator
- **Frontend**: React (for interactive components)
- **Styling**: SCSS + CSS Modules with design tokens
- **CMS**: [Storyblok](https://www.storyblok.com/) (headless CMS)
- **Language**: TypeScript (strict mode)
- **Deployment**: GitHub Pages with GitHub Actions
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

This site is configured for automatic deployment to GitHub Pages. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed setup instructions.

### Automated CI/CD

- **Trigger**: Push to `main` branch
- **Build**: Astro static site generation
- **Deploy**: GitHub Pages
- **Live**: Available at your GitHub Pages URL

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

Create a `.env` file for local development:

```bash
# Storyblok CMS
STORYBLOK_TOKEN=your_preview_token_here

# Build Environment
NODE_ENV=development

# Site Configuration
PUBLIC_SITE_URL=http://localhost:4321
```

## 📋 Content Management

The site uses Storyblok as a headless CMS for:
- Event listings and details
- Gallery images with tags
- Workshop information
- Studio content and team info

Content models are configured in `astro.config.mjs` and components are in `src/components/storyblok/`.

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