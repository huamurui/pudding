

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
  name: "Greenhouse between Clouds",
  ogName: "云苔的blog",
  description: "这是一个使用Astro构建的用来放各种乱七八糟东西的网站",
  keywords: "云苔,芸薹,huamurui,花木瑞,blog,tech,software,nonsense,chattering,碎碎念,web,front-end",
  url: "https://huamurui.github.io",
  author: {
    name: "云苔",
    email: "huamurui@outlook.com",
    github: "https://github.com/huamurui",
  },
  navItems: [
    { href: "/", label: "首页" },
    { href: "/timeline", label: "时间线" },
    { href: "/about", label: "关于" },
  ],
  socialLinks: [
    { name: "GitHub", href: "https://github.com/huamurui" },
    { name: "Email", href: "mailto:huamurui@outlook.com" },
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
  locale: "zh_CN",
  postsPerPage: 10,
};
