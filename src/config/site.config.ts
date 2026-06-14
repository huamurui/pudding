

export interface SiteConfig {
  name: string;
  description: string;
  url: string;
  base: string;
  site: string;
  keywords: Array<string>;
  author: {
    name: string;
    email?: string;
    github?: string;
    avatar?: string;
  };
  navItems: Array<{
    href: string;
    labelKey: string;
    label:string;
  }>;
  socialLinks: Array<{
    nameKey: string;
    href: string;
    icon?: string;
  }>;
  theme: {
    light: {
      primary: string;
      secondary?: string;
    };
    dark: {
      primary: string;
      secondary?: string;
    };
  };
  locale: string;
  giscus?: {
    enabled: boolean;
    repo: string;
    repoId: string;
    category: string;
    categoryId: string;
    mapping: string;
    strict: string;
    reactionsEnabled: string;
    emitMetadata: string;
    inputPosition: string;
    lang: string;
    loading: 'lazy' | 'eager';
  };
}

export const siteConfig: SiteConfig = {
  name: "Site Name",
  description: "Site Description",
  url: "https://yoursite.com",
  site: "https://huamurui.github.io",
  base: "/pudding",
  keywords: ["astro", "blog", "theme", "pudding"],
  author: {
    name: "Your Name",
    email: "your@email.com",
    github: "https://github.com/your",
  },
  navItems: [
    { href: "./", labelKey: "home", label:"home" },
    { href: "./timeline", labelKey: "timeline", label:"timeline"  },
    { href: "./about", labelKey: "about", label:"about"  },
  ],
  socialLinks: [
    { nameKey: "social.github", href: "https://github.com/your" },
    { nameKey: "social.email", href: "mailto:your@email.com" },
    { nameKey: "social.rss", href: "./rss.xml" },
    { nameKey: "social.sitemap", href: "./sitemap-index.xml" },
  ],
  theme: {
    light: {
      primary: "#5e7eff",
    },
    dark: {
      primary: "#ff9eb6",
    },
  },
  locale: "en-US",
  giscus: {
    enabled: false,
    repo: "your-repo/your-repo",
    repoId: "your-repo-id",
    category: "General",
    categoryId: "your-category-id",
    mapping: "pathname",
    strict: "0",
    reactionsEnabled: "1",
    emitMetadata: "0",
    inputPosition: "bottom",
    lang: "en-US",
    loading: "lazy"
  }
};
