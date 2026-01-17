# Documentation Index

Complete documentation for Singapore Handpan Studio website.

## Quick Links

- [Setup Guide](#setup)
- [Features](#features)
- [Deployment](#deployment)
- [Development](#development)

## Setup

### Getting Started

- **[Environment Setup](setup/ENVIRONMENT.md)** - Install dependencies, configure environment variables
- **[Storyblok CMS](setup/STORYBLOK.md)** - Setup content management system
- **[Calendly Integration](setup/CALENDLY.md)** - Configure booking system

### First Time Setup

1. Follow [Environment Setup](setup/ENVIRONMENT.md)
2. Setup [Storyblok CMS](setup/STORYBLOK.md)
3. (Optional) Configure [Calendly](setup/CALENDLY.md)
4. Run `npm run dev` to start development

## Features

### Content Management

- **[Gallery Feature](features/GALLERY.md)** - Photo/video gallery with filtering and lightbox

### E-Commerce

- **[Shop Feature](features/SHOP.md)** - Shopify integration for selling handpans and accessories

### Coming Soon

- Events management guide
- SEO optimization guide
- Performance tuning guide

## Deployment

- **[Cloudflare Pages](deployment/CLOUDFLARE.md)** - Deploy to Cloudflare Pages with automatic builds

## Development

### Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── storyblok/   # CMS components
│   ├── GalleryGrid.tsx
│   └── ...
├── layouts/         # Page layouts
├── pages/           # Route pages
├── styles/          # Global styles & tokens
└── utils/           # Utility functions

storyblok/
├── components/      # CMS component schemas
└── content-types/   # Content type definitions

scripts/
├── storyblok-setup.js          # Automated CMS setup
├── create-components.js        # Component creator
└── create-sample-content.js    # Sample content generator
```

### Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Linting & Formatting
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run format           # Format with Prettier

# Storyblok Automation
npm run storyblok:setup      # Setup components & folders
npm run storyblok:components # Create/update components
npm run storyblok:content    # Create sample content
```

### Tech Stack

- **Framework**: Astro with static site generation
- **Frontend**: React islands for interactivity
- **Styling**: SCSS + CSS Modules with design tokens
- **CMS**: Storyblok headless CMS
- **Language**: TypeScript (strict mode)
- **Deployment**: Cloudflare Pages
- **Code Quality**: ESLint + Prettier

### Key Technologies

- **Gallery**: yet-another-react-lightbox
- **Booking**: Calendly integration
- **SEO**: Meta tags, JSON-LD, sitemap
- **Performance**: Static generation, lazy loading, CDN

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## Support

### Common Issues

See individual setup guides for troubleshooting:

- [Environment Issues](setup/ENVIRONMENT.md#troubleshooting)
- [Storyblok Issues](setup/STORYBLOK.md#troubleshooting)
- [Deployment Issues](deployment/CLOUDFLARE.md#troubleshooting)

### Resources

- [Astro Documentation](https://docs.astro.build/)
- [Storyblok Documentation](https://www.storyblok.com/docs)
- [React Documentation](https://react.dev/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)

## License

This project is proprietary to Singapore Handpan Studio.
