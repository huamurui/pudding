import type { APIRoute } from 'astro'
import { getPublishedPosts, groupPostsByDirectory } from '@/utils/content'
import { siteConfig } from '@/config/site.config'
import { buildUrl, getPostUrl, getTagUrl } from '@/utils/helpers'

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

export const GET: APIRoute = async() => {
  const posts = await getPublishedPosts()
  const origin = new URL(siteConfig.site)
  const entries = new Map<string, Date | undefined>()
  const add = (path: string, updated?: Date) => {
    const url = new URL(path, origin)
    if (url.origin !== origin.origin) return
    url.hash = ''
    url.search = ''
    if (!url.pathname.endsWith('/') && !/\/[^/]+\.[^/]+$/.test(url.pathname)) url.pathname += '/'
    entries.set(url.href, updated)
  }

  for (const path of ['', 'timeline/', 'about/', 'links/']) add(buildUrl(path))
  for (const item of siteConfig.navItems) add(buildUrl(item.href))
  for (const post of posts) add(getPostUrl(post.id), post.data.updated || post.data.date)
  for (const directory of groupPostsByDirectory(posts).keys()) add(getPostUrl(directory))
  const tags = new Set(posts.flatMap(post => post.data.tags))
  for (const tag of tags) add(getTagUrl(tag))

  const urls = Array.from(entries, ([url, updated]) => `  <url>
    <loc>${escapeXml(url)}</loc>${updated ? `\n    <lastmod>${updated.toISOString()}</lastmod>` : ''}
  </url>`).join('\n')
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="${escapeXml(buildUrl('sitemap.xsl'))}"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`

  return new Response(sitemap, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  })
}
