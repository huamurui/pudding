import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders'; // 不适用于旧版 API

const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/posts/" }),
  //   schema: /* ... */
});


export const collections = { posts };