import rss, { pagesGlobToRssItems } from '@astrojs/rss'
import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'

export const GET:APIRoute = async(context) => {
  const blog = await getCollection('posts')
  return rss({
    title: 'Pudding | Blog',
    description: 'My Blog',
    site: context.site || '',
    items: blog.map((post) => ({
      title: post.data.title,
      date: post.data.date,
      description: post.data.description,
      // Compute RSS link from post `id`
      // This example assumes all posts are rendered as `/blog/[id]` routes
      link: `/blog/${post.id}/`
    })),
    customData: '<language>zh-cn</language>'
  })
}