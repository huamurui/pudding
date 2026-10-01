import rss from '@astrojs/rss'
import type { APIRoute } from 'astro'
import { getPublishedPosts } from '@/utils/content'
import { siteConfig } from '@/config/site.config'
import { getLocale } from '@/config/i18n.config'
import { buildUrl, extractExcerptFromMarkdown, getPostUrl } from '@/utils/helpers'

export const GET:APIRoute = async(context) => {
  const blog = (await getPublishedPosts()).sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
  return rss({
    title: siteConfig.name,
    description: siteConfig.description,
    site: new URL(buildUrl(''), context.site || siteConfig.site || siteConfig.url),
    items: blog.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description || extractExcerptFromMarkdown(post.body || ''),
      link: getPostUrl(post.id)
    })),
    customData: `<language>${getLocale(siteConfig.locale).toLowerCase()}</language>`,
    stylesheet: buildUrl('rss.xsl')
  })
}
