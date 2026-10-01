import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'
import { glob } from 'astro/loaders'

const postImageSchema = z.object({
  url: z.url(),
  alt: z.string().optional()
})


const postsSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  description: z.string().optional(),
  date: z.coerce.date(),
  tags: z.array(z.string().trim().min(1, '标签不能为空').transform(tag => tag.normalize()))
    .default([]).transform(tags => [...new Set(tags)]),
  image: postImageSchema.optional(),
  author: z.string().optional(),
  updated: z.coerce.date().optional(),
  url: z.string().optional(),
  draft: z.boolean().default(false),
  pinned: z.boolean().default(false)
})

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/posts/' }),
  schema: postsSchema
})

export const collections = { posts }
