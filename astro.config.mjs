// @ts-check
import { defineConfig } from "astro/config";
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkSpoiler from './src/plugin/remark-spoiler.js'; // 导入插件
import remarkLinkPreview from './src/plugin/remark-link-preview.js';
import sitemap from '@astrojs/sitemap';
import svelte from '@astrojs/svelte';
import path from 'path';

// https://astro.build/config
export default defineConfig({
  site: 'https://huamurui.github.io/pudding',
  // base: '/',
  integrations: [svelte(), sitemap()],
  markdown: {
    remarkPlugins: [remarkMath, remarkSpoiler, remarkLinkPreview],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      langs: [],
      transformers: [],
    },
  },
  vite: {
    resolve: {
      alias: {
        '@': path.resolve('./src'),
        '~': path.resolve('./src'),
      },
    },
  },
});