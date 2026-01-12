

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
    { href: "./", labelKey: "home" },
    { href: "./timeline", labelKey: "timeline" },
    { href: "./about", labelKey: "about" },
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
  locale: "zh-CN",
};
