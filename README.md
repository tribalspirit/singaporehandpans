# Singapore Handpan Studio

A modern, responsive website for Singapore Handpan Studio built with Astro, React, TypeScript, and SCSS.

## 🎵 About

Singapore Handpan Studio is dedicated to sharing the healing sounds of handpan music through our academy, events, and community gatherings in Singapore.

## ✨ Features

- 🎨 **Modern Design** - Clean, responsive UI with smooth animations
- 📱 **Mobile-First** - Optimized for all devices
- 🎭 **Event Management** - Upcoming/past events with Acuity Scheduling booking
- 🖼️ **Photo Gallery** - Tag-based filtering with lightbox viewer
- 📝 **CMS Integration** - Content management via Storyblok
- ⚡ **Performance** - Static site generation, lazy loading, CDN
- ♿ **Accessibility** - WCAG compliant, keyboard navigation
- 🔍 **SEO Optimized** - Meta tags, JSON-LD, sitemap

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your tokens

# Start development server
npm run dev

# Build for production
npm run build
```

Visit `http://localhost:4321` to see your site.

## 📚 Documentation

Complete documentation is available in the [`/docs`](./docs) folder:

- **[Setup Guide](docs/setup/ENVIRONMENT.md)** - Environment, Storyblok, Acuity setup
- **[Gallery Feature](docs/features/GALLERY.md)** - Using the gallery feature
- **[Deployment](docs/deployment/CLOUDFLARE.md)** - Deploy to Cloudflare Pages

### Quick Links

- [Environment Setup](docs/setup/ENVIRONMENT.md)
- [Storyblok CMS Setup](docs/setup/STORYBLOK.md)
- [Acuity Scheduling Integration](docs/setup/ACUITY.md)
- [Cloudflare Deployment](docs/deployment/CLOUDFLARE.md)

## 🛠️ Tech Stack

- **Framework**: [Astro](https://astro.build/) - Static Site Generator
- **Frontend**: React (for interactive components)
- **Styling**: SCSS + CSS Modules with design tokens
- **CMS**: [Storyblok](https://www.storyblok.com/) headless CMS
- **Language**: TypeScript (strict mode)
- **Deployment**: Cloudflare Pages
- **Code Quality**: ESLint + Prettier

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── storyblok/      # CMS components
│   ├── GalleryGrid.tsx # Gallery with filtering
│   └── ...
├── layouts/            # Page layouts
├── pages/              # Route pages
│   ├── index.astro     # Home page
│   ├── events.astro    # Events listing
│   ├── gallery.astro   # Photo gallery
│   └── ...
├── styles/             # Global styles & tokens
└── utils/              # Utility functions

docs/                   # Documentation
storyblok/             # CMS schemas
scripts/               # Automation scripts
```

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start dev server (http://localhost:4321)
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run format           # Format with Prettier

# Storyblok Automation
npm run storyblok:setup      # Setup CMS components & folders
npm run storyblok:components # Create/update individual components
npm run storyblok:content    # Create sample content
```

## 🌐 Environment Variables

Create a `.env` file:

```bash
# Storyblok CMS (Required)
STORYBLOK_TOKEN=your_preview_token_here

# Site Configuration
NODE_ENV=development
PUBLIC_SITE_URL=http://localhost:4321

# Acuity Scheduling (Booking)
PUBLIC_ACUITY_OWNER_ID=your_acuity_owner_id
PUBLIC_ACUITY_WORKSHOP_URL=https://app.acuityscheduling.com/schedule.php?owner=YOUR_ID
PUBLIC_ACUITY_PRIVATE_URL=https://app.acuityscheduling.com/schedule.php?owner=YOUR_ID
```

See [Environment Setup Guide](docs/setup/ENVIRONMENT.md) for detailed instructions.

## 📦 Key Dependencies

- `astro` - Static site generator
- `react` / `react-dom` - UI library
- `@storyblok/astro` - CMS integration
- `yet-another-react-lightbox` - Gallery lightbox
- `typescript` - Type safety
- `sass` - CSS preprocessing

## 🚀 Deployment

Deploy to Cloudflare Pages:

1. Push code to GitHub
2. Connect repository to Cloudflare Pages
3. Configure build settings (see [Deployment Guide](docs/deployment/CLOUDFLARE.md))
4. Deploy automatically on push

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary to Singapore Handpan Studio.

## 📞 Support

For technical issues or questions:

- Check the [Documentation](docs/README.md)
- Review setup guides for specific features
- Check browser console for errors

For studio inquiries:

- Visit `/contacts` page
- Email: <singaporehandpanstudio@gmail.com>

---

Built with ❤️ using Astro, React, and TypeScript
