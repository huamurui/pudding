import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { siteConfig } from '@/config/site.config'
import { getPostUrl } from '@/utils/helpers'

export const GET: APIRoute = async() => {
  const posts = await getCollection('posts')
  const baseUrl = siteConfig.site + siteConfig.base

  // 1. 获取所有静态导航页
  const staticPages = siteConfig.navItems.map((item) => {
    // 处理相对路径
    const href = item.href.startsWith('./') ? item.href.slice(1) : item.href
    const isHome = href === '/'
    return `
  <url>
    <loc>${baseUrl}${href}</loc>
    <changefreq>${isHome ? 'daily' : 'weekly'}</changefreq>
    <priority>${isHome ? '1.0' : '0.8'}</priority>
  </url>`
  }).join('')

  // 2. 获取所有文章页
  const postPages = posts.map((post) => {
    const postPath = getPostUrl(post.id)
    const date = new Date(post.data.updated || post.data.date).toISOString()
    return `
  <url>
    <loc>${baseUrl}${postPath}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
  }).join('')

  // 3. 拼接完整的 XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages}
${postPages}
</urlset>`.trim()

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml'
    }
  })
}
