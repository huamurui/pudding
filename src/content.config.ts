import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const postImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
});


const postsSchema = z.object({
  title: z.string().min(1, "标题不能为空"),
  description: z.string().optional(),
  date: z.coerce.date(),
  tags: z.array(z.string()).default([]),
  image: postImageSchema.optional(),
  author: z.string().optional(),
  updated: z.coerce.date().optional(),
  url: z.string().optional(),
  draft: z.boolean().default(false),
});

const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/posts/" }),
  schema: postsSchema,
});

export const collections = { posts };