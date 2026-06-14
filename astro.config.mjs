// @ts-check
import { defineConfig } from "astro/config";
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkSpoiler from './src/plugin/remark-spoiler.js';
import remarkLinkPreview from './src/plugin/remark-link-preview.js';
import remarkImageOptimize from './src/plugin/remark-image-optimize.js';

import svelte from '@astrojs/svelte';
import expressiveCode from 'astro-expressive-code';
import path from 'path';
import { siteConfig } from "./src/config/site.config.ts";

export default defineConfig({
  site: siteConfig.site,
  base: siteConfig.base,
  image: {
    domains: [
      'docs.astro.build',
      'images.unsplash.com',
      'avatars.githubusercontent.com',
      'raw.githubusercontent.com',
      'res.cloudinary.com'
    ],
  },
  integrations: [
    svelte(),

    expressiveCode({
      themes: ['tokyo-night', 'one-light'],
      styleOverrides: {
        borderRadius: '8px',
        borderColor: 'var(--border-color)',
        codeFontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
      },
      // 配置主题选择器映射
      themeCssSelector: (theme) => {
        // 将我们的主题切换值映射到 Expressive Code 主题
        if (theme.name === 'tokyo-night') {
          return '[data-theme="dark"]';
        }
        if (theme.name === 'one-light') {
          return '[data-theme="light"]';
        }
        return false;
      },
      // 使用暗色模式媒体查询
      useDarkModeMediaQuery: true,
    }),
  ],
  markdown: {
    remarkPlugins: [remarkMath, remarkSpoiler, remarkLinkPreview, remarkImageOptimize],
    rehypePlugins: [rehypeKatex],
  },
  vite: {
    resolve: {
      alias: {
        '@': path.resolve('./src')
      },
    },
  },
});
