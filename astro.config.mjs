// @ts-check
import { defineConfig } from "astro/config";
import solid from "@astrojs/solid-js";
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://huamurui.github.io',
  // base: '/',
  integrations: [solid(), sitemap()],
  markdown: {
    remarkPlugins: [remarkMath],
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
});