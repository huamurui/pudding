export interface I18nConfig {
  common: {
    brand: string;
    menu: {
      toggle: string;
    };
    search: {
      placeholder: string;
      ariaLabel: {
        open: string;
        close: string;
        input: string;
        viewArticle: string;
      };
    };
    posts: {
      readingTime: string;
      noResults: string;
      count: string;
    };
    tags: {
      count: string;
    };
    timeline: {
      count: string;
    };
  };
  site: {
    name: string;
    ogName: string;
    description: string;
    keywords: string;
    author: string;
  };
  header: {
    nav: {
      home: string;
      timeline: string;
      about: string;
    };
  };
  footer: {
    copyright: string;
    poweredBy: string;
  };
  sidebar: {
    stats: {
      posts: string;
      tags: string;
      updated: string;
    };
  };
  about: {
    title: string;
    description: string;
    themeIntro: string;
    themeGuide: string;
    moreThemes: string;
    themeIntroEnd: string;
  };
  social: {
    github: string;
    email: string;
    rss: string;
    sitemap: string;
  };
}

export const i18nConfig: Record<string, I18nConfig> = {
  'zh-CN': {
    common: {
      brand: '云苔',
      menu: {
        toggle: '切换菜单'
      },
      search: {
        placeholder: '搜索文章...',
        ariaLabel: {
          open: '打开搜索框',
          close: '关闭搜索框',
          input: '输入关键词搜索文章',
          viewArticle: '查看文章：{title}'
        }
      },
      posts: {
        readingTime: '分钟阅读',
        noResults: '没有找到匹配的文章',
        count: 'posts'
      },
      tags: {
        count: 'posts'
      },
      timeline: {
        count: 'posts'
      }
    },
    site: {
      name: '云苔',
      ogName: '云苔',
      description: '云苔 - 一个基于 Astro 构建的轻量级高性能博客',
      keywords: '博客, Astro, 技术博客, 前端开发',
      author: 'Your Name'
    },
    header: {
      nav: {
        home: '首页',
        timeline: '时间线',
        about: '关于'
      }
    },
    footer: {
      copyright: '© {year} {author}. All rights reserved.',
      poweredBy: 'Powered by'
    },
    sidebar: {
      stats: {
        posts: '篇 文章',
        tags: '个标签',
        updated: '更新'
      }
    },
    about: {
      title: '关于本博客主题',
      description: '本博客基于 Astro 构建，采用轻量级高性能博客主题，专注于内容展示与阅读体验优化',
      themeIntro: '关于主题详情，可查看',
      themeIntroEnd: '或访问 Astro 官方文档了解更多网站建设方案。',
      themeGuide: '《通用 Astro 博客主题使用指南》',
      moreThemes: '查看更多博客主题示例'
    },
    social: {
      github: 'GitHub',
      email: 'Email',
      rss: 'RSS',
      sitemap: 'Sitemap'
    },

  },
  'en-US': {
    common: {
      brand: 'Yuntai',
      search: {
        placeholder: 'Search articles...',
        ariaLabel: {
          open: 'Open search box',
          close: 'Close search box',
          input: 'Enter keywords to search articles',
          viewArticle: 'View article: {title}'
        }
      },
      menu: {
        toggle: 'Toggle menu'
      },
      posts: {
        readingTime: 'min read',
        noResults: 'No matching articles found',
        count: 'posts'
      },
      tags: {
        count: 'posts'
      },
      timeline: {
        count: 'posts'
      }
    },
    site: {
      name: 'Yuntai',
      ogName: 'Yuntai',
      description: 'Yuntai - A lightweight, high-performance blog built with Astro',
      keywords: 'blog, Astro, tech blog, frontend development',
      author: 'Your Name'
    },
    header: {
      nav: {
        home: 'Home',
        timeline: 'Timeline',
        about: 'About'
      }
    },
    footer: {
      copyright: '© {year} {author}. All rights reserved.',
      poweredBy: 'Powered by'
    },
    sidebar: {
      stats: {
        posts: 'posts',
        tags: 'tags',
        updated: 'updated'
      }
    },
    about: {
      title: 'About This Blog Theme',
      description: 'This blog is built with <strong>Astro</strong>, featuring a lightweight, high-performance blog theme focused on content display and reading experience optimization',
      themeIntro: 'For theme details, check out',
      themeIntroEnd: 'or visit the official Astro documentation for more site building solutions.',
      themeGuide: 'Universal Astro Blog Theme Guide',
      moreThemes: 'View more blog theme examples'
    },
    social: {
      github: 'GitHub',
      email: 'Email',
      rss: 'RSS',
      sitemap: 'Sitemap'
    },
  }
};

export type SupportedLocale = keyof typeof i18nConfig;

export const defaultLocale: SupportedLocale = 'zh-CN';

export function getLocale(locale?: string): SupportedLocale {
  if (locale && locale in i18nConfig) {
    return locale as SupportedLocale;
  }
  return defaultLocale;
}

export function t(locale: SupportedLocale, path: string, params?: Record<string, string | number>): string {
  const config = i18nConfig[locale];
  const keys = path.split('.');
  let value: any = config;
  
  for (const key of keys) {
    value = value?.[key];
    if (value === undefined) {
      console.warn(`i18n: Missing translation for "${path}" in locale "${locale}"`);
      return path;
    }
  }
  
  if (typeof value === 'string' && params) {
    return value.replace(/\{(\w+)\}/g, (_, key) => params[key]?.toString() || `{${key}}`);
  }
  
  return value;
}
