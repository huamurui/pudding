import type { APIRoute } from 'astro'
import { siteConfig } from '@/config/site.config'
import { buildUrl } from '@/utils/helpers'

const getRobotsTxt = (sitemapURL: URL) => `\
User-agent: *
Allow: /
Sitemap: ${sitemapURL.href}
`

export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL(buildUrl('sitemap.xml'), site || siteConfig.site)
  return new Response(getRobotsTxt(sitemapURL), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
