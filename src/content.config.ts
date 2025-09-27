import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders'; // 不适用于旧版 API

const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/posts/" }),
  //   schema: /* ... */
});

// const probes = defineCollection({
//   // `loader` 可以接受多个模式的数组以及字符串模式"
//   // 加载 space-probes 目录中的所有 Markdown 文件，以 "voyager-" 开头的文件除外
//   loader: glob({ pattern: ['*.md', '!voyager-*'], base: 'src/data/space-probes' }),
//   schema: z.object({
//     name: z.string(),
//     type: z.enum(['Space Probe', 'Mars Rover', 'Comet Lander']),
//     launch_date: z.date(),
//     status: z.enum(['Active', 'Inactive', 'Decommissioned']),
//     destination: z.string(),
//     operator: z.string(),
//     notable_discoveries: z.array(z.string()),
//   }),
// });

export const collections = { posts };