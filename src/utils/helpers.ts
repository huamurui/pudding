/**
 * 工具函数
 */

import { siteConfig } from '@/config/site.config'

/**
 * 统一的 URL 拼接方法
 * @param path 路径，可以是字符串或数组
 * @returns 完整的 URL，包含 base 路径
 */
export function buildUrl(path: string | string[]): string {
  const relativePath = Array.isArray(path) ? path.join('/') : path
  // Navigation may also contain external links; do not turn their scheme into a path.
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(relativePath)) return relativePath

  const base = `/${siteConfig.base || ''}`.replace(/\/+/g, '/').replace(/\/$/, '')
  const [, pathname = '', suffix = ''] = relativePath.match(/^([^?#]*)(.*)$/) || []
  const parts = pathname.split('/').filter(part => part && part !== '.')
  const trailingSlash = pathname.endsWith('/') || !parts.length
  const cleanPath = parts.join('/')
  return `${base}/${cleanPath}${trailingSlash && cleanPath ? '/' : ''}${suffix}`
}

/**
 * 从 HTML 中提取摘要
 */
export function extractExcerptFromHtml(html: string, maxLength: number = 300): string {
  // 1. 查找 <!-- more --> 标记
  const moreMarker = /<!--\s*more\s*-->/i
  if (moreMarker.test(html)) {
    const [excerptHtml] = html.split(moreMarker)
    return excerptHtml.trim()
  }

  // 2. 自动提取第一段（到第一个块级元素结束）
  const firstParagraphMatch = html.match(/<(p|ul|ol)\b[^>]*>[\s\S]*?<\/\1>/i)
  if (firstParagraphMatch) {
    return firstParagraphMatch[0]
  }

  // 3. 兜底处理
  const text = html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]+>/g, '').trim()
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}…` : text
}

/** 从 Markdown 中提取适合列表和 meta description 的纯文本摘要。 */
export function extractExcerptFromMarkdown(markdown: string, maxLength: number = 300): string {
  const source = markdown.split(/<!--\s*more\s*-->/i)[0]
    .replace(/^(?:```|~~~)[^\n]*\n[\s\S]*?^(?:```|~~~)\s*$/gm, '')
    .replace(/<!--[\s\S]*?-->/g, '')
  const paragraph = source
    .split(/\n\s*\n/)
    .map(block => block.trim())
    .find(block => block && !/^(---|#|```|>|!\[)/.test(block)) || ''

  const text = paragraph
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_~|]/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}…` : text
}

/**
 * 计算阅读时间（分钟）
 */
export function calculateReadingTime(content: string, wordsPerMinute: number = 200): number {
  if (!Number.isFinite(wordsPerMinute) || wordsPerMinute <= 0) {
    throw new RangeError('Reading speed must be positive')
  }
  return Math.ceil(countWords(content) / wordsPerMinute)
}
/**
 * 统计字数
 */
export function countWords(content: string): number {
  // 处理中英文状况，所以，空格是不合适的，直接字符数也不合适
  const strippedContent = content.replace(/<[^>]+>/g, '').trim()

  const chineseCharCount = (strippedContent.match(/[\u4e00-\u9fa5]/g) || []).length
  const englishWordCount = (strippedContent.match(/[a-zA-Z]+/g) || []).length
  return chineseCharCount + englishWordCount
}
/**
 * 格式化日期
 */
export function formatDate(date: Date | string, format: 'iso' | 'local' = 'iso'): string {
  const d = typeof date === 'string' ? new Date(date) : date

  if (format === 'iso') {
    return d.toISOString().split('T')[0]
  }

  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * 生成文章 URL
 */
export function getPostUrl(postId: string, basePath: string = '/posts'): string {
  return buildUrl([basePath, postId.split('/').map(encodeURIComponent).join('/'), ''])
}

/**
 * 生成标签 URL
 */
export function getTagRoutePath(tag: string): string {
  const normalized = tag.normalize()
  // Keep ordinary labels readable. Reserved characters and dot segments need a
  // reversible key that neither Astro nor URL parsers can reinterpret. Reserve
  // the prefix itself so a literal label cannot collide with an encoded label.
  const hasControlCharacter = Array.from(normalized).some(char => char.charCodeAt(0) < 0x20 || char.charCodeAt(0) === 0x7f)
  if (/[%/?#\\]/.test(normalized) || hasControlCharacter || /^\.{1,2}$/.test(normalized) || normalized.startsWith('~')) {
    return `~${Array.from(new TextEncoder().encode(normalized), byte => byte.toString(16).padStart(2, '0')).join('')}`
  }
  return normalized
}

export function getTagUrl(tag: string, basePath: string = '/tags'): string {
  return buildUrl([basePath, encodeURIComponent(getTagRoutePath(tag)), ''])
}

/**
 * 生成安全的 view-transition-name
 */
export function sanitizeViewTransitionName(id: string): string {
  // Encoding every code point keeps names distinct even for Chinese titles or punctuation.
  return `post-${Array.from(String(id), char => char.codePointAt(0)!.toString(16)).join('-')}`
}

/**
 * 检查是否为文章页面
 */
export function isPostPage(pathname: string, postPath: string = '/posts'): boolean {
  const prefix = buildUrl(postPath).replace(/\/$/, '')
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

/**
 * 检查是否为首页
 */
export function isHomePage(pathname: string): boolean {
  const home = buildUrl('')
  return pathname === home || pathname === home.replace(/\/$/, '') || pathname === `${home}index.html`
}


/**
 * 生成面包屑导航项（基于文件目录）
 */
export function generateBreadcrumbItems(postId: string, _isCategory: boolean = false): Array<{ label: string; href: string }> {
  const items: Array<{ label: string; href: string }> = [
    { label: 'Home', href: buildUrl('') }
  ]

  const pathParts = postId.split('/').filter(Boolean)

  let currentPath = ''
  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i]
    currentPath += `${currentPath ? '/' : ''}${part}`
    items.push({
      label: part.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      href: getPostUrl(currentPath)
    })
  }

  return items
}
