

export interface SiteConfig {
  name: string;
  ogName: string;
  description: string;
  keywords: string;
  url: string;
  author: {
    name: string;
    email?: string;
    github?: string;
    avatar?: string;
  };
  navItems: Array<{
    href: string;
    label: string;
  }>;
  socialLinks: Array<{
    name: string;
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
  defaultOgImage: string;
  locale: string;
  postsPerPage?: number;
}

export const siteConfig: SiteConfig = {
  name: "Your Site Name",
  ogName: "Your Site ogName",
  description: "Your Site Description",
  keywords: "Your Site Keywords",
  url: "https://yoursite.com",
  author: {
    name: "Your Name",
    email: "your@email.com",
    github: "https://github.com/your",
  },
  navItems: [
    { href: "/", label: "首页" },
    { href: "/timeline", label: "时间线" },
    { href: "/about", label: "关于" },
  ],
  socialLinks: [
    { name: "GitHub", href: "https://github.com/your" },
    { name: "Email", href: "mailto:your@email.com" },
    { name: "RSS", href: "/rss.xml" },
    { name: "Sitemap", href: "/sitemap-index.xml" },
  ],
  theme: {
    light: {
      primary: "#5e7eff",
    },
    dark: {
      primary: "#ff9eb6",
    },
  },
  defaultOgImage: "/og-default.jpg",
  locale: "en",
  postsPerPage: 10,
};
