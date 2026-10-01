export interface I18nConfig {
  common: {
    brand: string;
    menu: {
      toggle: string;
    };
    search: {
      placeholder: string;
      loadError: string;
      noResults: string;
      resultCount: string;
      loading: string;
      region: string;
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
      pinned: string;
    };
    tags: {
      count: string;
    };
    timeline: {
      count: string;
    };
    category: {
      count: string;
    };
    breadcrumb: {
      loadError: string;
      loading: string;
      empty: string;
      label: string;
      children: string;
    };
    backToTop: string;
    readingProgress: string;
    theme: {
      light: string;
      dark: string;
      label: string;
    };
    toc: {
      label: string;
      quickLabel: string;
      currentSection: string;
      quickNavLabel: string;
    };
  };
  header: {
    nav: {
      home: string;
      timeline: string;
      about: string;
      links: string;
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
  social: {
    github: string;
    email: string;
    rss: string;
    sitemap: string;
  };
}

export const i18nConfig = {
  'zh-CN': {
    common: {
      brand: 'Pudding',
      menu: {
        toggle: '切换菜单'
      },
      search: {
        placeholder: '搜索文章...',
        loadError: '搜索数据加载失败，请稍后重试。',
        noResults: '没有找到匹配的文章',
        resultCount: '找到 {count} 篇文章',
        loading: '加载全文索引...',
        region: '文章搜索区域',
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
        count: 'posts',
        pinned: '置顶'
      },
      tags: {
        count: 'posts'
      },
      timeline: {
        count: 'posts'
      },
      category: {
        count: 'posts'
      },
      breadcrumb: {
        loadError: '加载失败',
        loading: '加载中...',
        empty: '没有子项目',
        label: '面包屑导航',
        children: '查看 {label} 下的子目录'
      },
      backToTop: '回到顶部',
      readingProgress: '阅读进度',
      theme: {
        light: '亮色',
        dark: '暗色',
        label: '当前是{current}主题，切换到{target}主题'
      },
      toc: {
        label: '文章目录',
        quickLabel: '快速目录',
        currentSection: '当前章节：{title}',
        quickNavLabel: '快速导航到章节：{title}'
      }
    },
    header: {
      nav: {
        home: '首页',
        timeline: '时间线',
        about: '关于',
        links: '友链'
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
    social: {
      github: 'GitHub',
      email: 'Email',
      rss: 'RSS',
      sitemap: 'Sitemap'
    }

  },
  'en-US': {
    common: {
      brand: 'Pudding',
      search: {
        placeholder: 'Search articles...',
        loadError: 'Search data could not be loaded. Please try again later.',
        noResults: 'No matching articles found',
        resultCount: '{count} posts found',
        loading: 'Loading full-text index...',
        region: 'Article search',
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
        count: 'posts',
        pinned: 'Pinned'
      },
      tags: {
        count: 'posts'
      },
      timeline: {
        count: 'posts'
      },
      category: {
        count: 'posts'
      },
      breadcrumb: {
        loadError: 'Could not load items',
        loading: 'Loading...',
        empty: 'No items',
        label: 'Breadcrumb',
        children: 'View items under {label}'
      },
      backToTop: 'Back to top',
      readingProgress: 'Reading progress',
      theme: {
        light: 'light',
        dark: 'dark',
        label: '{current} theme active. Switch to {target} theme'
      },
      toc: {
        label: 'Table of contents',
        quickLabel: 'Quick contents',
        currentSection: 'Current section: {title}',
        quickNavLabel: 'Go to section: {title}'
      }
    },
    header: {
      nav: {
        home: 'Home',
        timeline: 'Timeline',
        about: 'About',
        links: 'Links'
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
    social: {
      github: 'GitHub',
      email: 'Email',
      rss: 'RSS',
      sitemap: 'Sitemap'
    }
  }
} satisfies Record<string, I18nConfig>

export type SupportedLocale = keyof typeof i18nConfig;

export const defaultLocale: SupportedLocale = 'zh-CN'

export function getLocale(locale?: string): SupportedLocale {
  if (locale && Object.hasOwn(i18nConfig, locale)) {
    return locale as SupportedLocale
  }
  return defaultLocale
}

export function t(locale: SupportedLocale, path: string, params?: Record<string, string | number>): string {
  const config = i18nConfig[getLocale(locale)]
  const keys = path.split('.')
  let value: unknown = config

  for (const key of keys) {
    if (typeof value !== 'object' || value === null || !Object.hasOwn(value, key)) {
      console.warn(`i18n: Missing translation for "${path}" in locale "${locale}"`)
      return path
    }
    value = (value as Record<string, unknown>)[key]
  }

  if (typeof value !== 'string') return path
  if (!params) return value
  return value.replace(/\{(\w+)\}/g, (_, key: string) => params[key]?.toString() ?? `{${key}}`)
}
