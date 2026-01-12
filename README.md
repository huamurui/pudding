# Astro Theme Pudding

A modern, customizable Astro blog theme.

## Features

- 🎨 **Modern Design** - Clean and beautiful interface
- 🌓 **Dark Mode** - Light/dark theme switching support
- 📱 **Responsive Design** - Perfect for mobile and desktop
- 📝 **Markdown Support** - Full Markdown and math formula support
- 🏷️ **Tag System** - Flexible tag management and filtering
- 📊 **SEO Optimized** - Complete structured data and SEO support
- 🍞 **Breadcrumb Navigation** - File directory-based breadcrumbs

## Quick Start

### Installation

```bash
npm install
# or
pnpm install
```

### Development

```bash
npm run dev
# or
pnpm dev
```

### Build

```bash
npm run build
# or
pnpm build
```

### Preview

```bash
npm run preview
# or
pnpm preview
```

## Configuration

All configuration is in `src/config/site.config.ts`:

```typescript
export const siteConfig: SiteConfig = {
  name: "Your Site Name",
  description: "Your site description",
  url: "https://yoursite.com",
  author: {
    name: "Your Name",
    email: "your@email.com",
  },
  // Theme colors configuration
  theme: {
    light: {
      primary: "#5e7eff",
    },
    dark: {
      primary: "#ff9eb6",
    },
  },
  locale: "en-US", // or "zh-CN"
  // Add more language support in `src/config/i18n.config.ts`
  // ... more config
};
```

## Features Guide

### Post Management

Posts are placed in the `src/posts/` directory with support for nested folder structures. Each post requires the following frontmatter:

```markdown
---
title: "Post Title"
date: 2025-01-01
description: "Post description"
tags: ["tag1", "tag2"]
pinned: true  # Optional: pin post to top
---
```

### Category Pages

Category pages are automatically generated based on the directory structure. For example, posts in `src/posts/tech/` will be accessible at `/posts/tech/` without needing to create an index.md file.

### Breadcrumb Navigation

Breadcrumb navigation is automatically generated based on the file directory structure, showing the path from Home to the current page.

### Tag System

Tags are automatically extracted from post frontmatter, generating tag pages and statistics.

### Post Pinning

Add `pinned: true` to post frontmatter to pin it to the top of post lists. Pinned posts display with a 📌 icon and special styling.

### Markdown Extensions

#### link-card

Supports inserting link cards in markdown. For example:

```markdown
[Link Card](https://example.com)
```

This generates a link card pointing to `https://example.com`.

#### spoiler

Supports spoiler content with different styles:

```markdown
||| black-spoiler |||
|| blur-spoiler ||
```

## License

MIT

## Credits

Built with [Astro](https://astro.build/)

Inspired by many other blog themes' designs and implementations, especially [fuwari](https://github.com/saicaca/fuwari).
