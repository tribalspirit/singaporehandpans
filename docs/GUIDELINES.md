# Documentation Guidelines

Guidelines for maintaining organized, user-friendly documentation for this project.

## Structure

```
/
├── README.md              ✅ Main project overview ONLY
├── tasks.md               ✅ Development task tracking
├── docs/                  ✅ ALL documentation goes here
│   ├── README.md         → Documentation index
│   ├── setup/            → Setup & configuration guides
│   ├── features/         → Feature usage guides
│   └── deployment/       → Deployment & production guides
└── [config files]         ✅ package.json, tsconfig.json, etc.
```

## Rules

### ✅ DO

**Root Directory**:
- Keep README.md concise (overview, quick start, links)
- Include only essential configuration files
- Link to `/docs` for detailed information

**Documentation Files**:
- Place ALL docs in `/docs` subdirectories
- Use clear, descriptive filenames (UPPERCASE.md)
- Include troubleshooting sections
- Cross-link related documentation
- Keep user-focused (no technical internals)

**New Features**:
1. Create guide in `docs/features/FEATURE.md`
2. Update setup docs if needed
3. Add to `docs/README.md` index
4. Link from main README.md if essential

### ❌ DON'T

**Never Add to Root**:
- ❌ Feature implementation guides
- ❌ Setup/deployment guides
- ❌ Bug fix summaries
- ❌ Technical reports
- ❌ Troubleshooting docs
- ❌ Internal development notes

**Avoid**:
- ❌ Duplicate information across files
- ❌ Technical jargon without explanation
- ❌ Scattered documentation
- ❌ Implementation details in user guides

## Documentation Types

### Setup Guides (`docs/setup/`)
**Purpose**: Help users configure the project

**Include**:
- Prerequisites
- Step-by-step instructions
- Environment variables
- Verification steps
- Troubleshooting

**Examples**:
- `ENVIRONMENT.md` - Development environment
- `STORYBLOK.md` - CMS configuration
- `CALENDLY.md` - Integration setup

### Feature Guides (`docs/features/`)
**Purpose**: Teach users how to use features

**Include**:
- Feature overview
- Usage instructions
- Best practices
- Customization options
- Troubleshooting

**Examples**:
- `GALLERY.md` - Using the gallery
- `EVENTS.md` - Managing events

### Deployment Guides (`docs/deployment/`)
**Purpose**: Deploy to production

**Include**:
- Platform requirements
- Configuration steps
- Deployment process
- Monitoring & maintenance
- Troubleshooting

**Examples**:
- `CLOUDFLARE.md` - Deploy to Cloudflare Pages

## Quality Checklist

Every documentation file should have:

- [ ] Clear, descriptive title
- [ ] Purpose/overview at the top
- [ ] Prerequisites section (if applicable)
- [ ] Step-by-step instructions
- [ ] Code examples with syntax highlighting
- [ ] Troubleshooting section
- [ ] Links to related docs
- [ ] Links to external resources
- [ ] No unexplained technical jargon

## Consolidation

When multiple docs cover similar topics:

1. **Merge** into one comprehensive guide
2. **Organize** with clear sections
3. **Remove** redundancy
4. **Delete** original scattered files
5. **Update** all links

Example:
- ENV-SETUP.md + CREATE-ENV.md → `docs/setup/ENVIRONMENT.md`

## Linking

### Internal Links
```markdown
[Setup Guide](docs/setup/ENVIRONMENT.md)
[Gallery Feature](docs/features/GALLERY.md)
[Deploy](docs/deployment/CLOUDFLARE.md)
```

### Documentation Index
Always update `docs/README.md` when adding new documentation.

### Main README
Link to detailed docs, don't duplicate content:
```markdown
## Setup

See [Setup Guide](docs/setup/ENVIRONMENT.md) for complete instructions.
```

## Maintenance

### Adding Features
1. Implement feature
2. Create `docs/features/FEATURE.md`
3. Update relevant setup docs
4. Update `docs/README.md`
5. Link from main README.md if essential
6. ❌ Don't create implementation reports

### Fixing Bugs
1. Fix the code
2. Update user-facing docs if affected
3. ❌ Don't create bug fix documentation files

### Updating Docs
1. Edit the consolidated file in `/docs`
2. Keep main README.md high-level
3. Update `docs/README.md` index if needed

## Examples

### ✅ GOOD Structure
```
/
├── README.md (overview + links)
├── docs/
│   ├── README.md (index)
│   ├── setup/ENVIRONMENT.md (comprehensive)
│   └── features/GALLERY.md (user-focused)
```

### ❌ BAD Structure
```
/
├── README.md
├── SETUP.md
├── ENV-SETUP.md
├── CREATE-ENV.md
├── GALLERY-IMPLEMENTATION.md
├── GALLERY-BUGFIX.md
└── docs/ (unused)
```

## Review Checklist

Before committing documentation changes:

- [ ] All docs in `/docs` (not root)
- [ ] Clear directory structure (setup/features/deployment)
- [ ] No duplicate content
- [ ] All links working
- [ ] `docs/README.md` updated
- [ ] Main README.md links to details
- [ ] No technical implementation details in user guides
- [ ] Troubleshooting sections included
- [ ] Code examples have syntax highlighting
- [ ] No temporary/internal files

## Questions?

When unsure where to put documentation:

1. **Is it about initial setup?** → `docs/setup/`
2. **Is it about using a feature?** → `docs/features/`
3. **Is it about deployment?** → `docs/deployment/`
4. **Is it internal/technical?** → Don't document it (or add to code comments)

**Remember**: Documentation is for users, not developers. Keep it clean, organized, and user-focused!

