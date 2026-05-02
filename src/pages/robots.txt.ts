import { siteConfig } from '@/config/site.config'

const getRobotsTxt = (sitemapURL: string) => `\
User-agent: *
Allow: /
Sitemap: ${sitemapURL}
`

export const GET: APIRoute = () => {
  const sitemapURL = new URL(siteConfig.base + '/sitemap-index.xml', siteConfig.site).href
  return new Response(getRobotsTxt(sitemapURL))
}