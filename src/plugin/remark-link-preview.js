import { visit } from 'unist-util-visit'
import fs from 'node:fs'
import path from 'node:path'

const TIMEOUT = 7000
const MAX_BYTES = 200 * 1024
const CACHE_FILE = path.join(process.cwd(), '.cache', 'link-previews.json')
const pending = new Map()

function readCache() {
  try {
    const value = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'))
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  } catch {
    return {}
  }
}

function writeCache(updates) {
  try {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true })
    // Markdown entries render concurrently. Merge freshly read data to preserve other entries.
    fs.writeFileSync(CACHE_FILE, JSON.stringify({ ...readCache(), ...updates }, null, 2), 'utf-8')
  } catch {
    // A read-only or missing cache must not stop Markdown rendering.
  }
}

function escapeHtml(value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function decodeEntities(value) {
  const entities = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' }
  return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (entity, name) => {
    if (name.startsWith('#')) {
      const code = name[1].toLowerCase() === 'x' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10)
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity
    }
    return entities[name.toLowerCase()] || entity
  })
}

function httpUrl(value, base) {
  try {
    const url = new URL(value, base)
    return /^https?:$/.test(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

function extractMetaFromHtml(html, url) {
  const meta = { title: null, description: null, image: null, site: new URL(url).hostname.replace(/^www\./, '') }
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)
  if (title) meta.title = decodeEntities(title[1].replace(/<[^>]*>/g, '').trim())

  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const attributes = {}
    for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g)) {
      attributes[match[1].toLowerCase()] = decodeEntities((match[2] ?? match[3] ?? match[4]).trim())
    }
    const key = (attributes.property || attributes.name || '').toLowerCase()
    const value = attributes.content
    if (!value) continue
    if (key === 'og:title') meta.title = value
    if (!meta.description && (key === 'og:description' || key === 'description')) meta.description = value
    if (!meta.image && (key === 'og:image' || key === 'twitter:image')) meta.image = httpUrl(value, url)
  }
  return meta
}

export async function fetchTextLimited(url, timeout = TIMEOUT, maxBytes = MAX_BYTES) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  let reader
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'astro-link-preview/1.0' }
    })
    if (!response.ok) {
      await response.body?.cancel()
      throw new Error(`HTTP ${response.status}`)
    }
    if (!(response.headers.get('content-type') || '').toLowerCase().includes('text/html')) {
      await response.body?.cancel()
      throw new Error('not html')
    }
    if (Number(response.headers.get('content-length')) > maxBytes) {
      await response.body?.cancel()
      throw new Error('too large')
    }

    const chunks = []
    let received = 0
    if (response.body) {
      reader = response.body.getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        received += value.byteLength
        if (received > maxBytes) throw new Error('too large')
        chunks.push(Buffer.from(value))
      }
    }
    return { text: Buffer.concat(chunks).toString('utf-8'), url: response.url || url }
  } finally {
    if (reader) {
      try { await reader.cancel() } catch { /* An aborted stream may already be closed. */ }
      reader.releaseLock()
    }
    clearTimeout(timer)
  }
}

function generateHtml(url, meta) {
  const title = escapeHtml(meta.title || url)
  const description = meta.description ? escapeHtml(meta.description) : ''
  // Old caches also need URL validation; metadata is supplied by remote websites.
  const image = meta.image ? httpUrl(meta.image, url) : null
  const site = escapeHtml(meta.site || new URL(url).hostname)
  const imageHtml = image
    ? `<div class="link-card__img-wrapper"><img class="link-card__img" src="${escapeHtml(image)}" alt="${title}" loading="lazy" decoding="async"></div>`
    : ''

  return `<figure class="link-card">
  <a class="link-card__link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">
    ${imageHtml}
    <div class="link-card__body">
      <h4 class="link-card__title">${title}</h4>
      ${description ? `<p class="link-card__desc">${description}</p>` : ''}
      <div class="link-card__meta">${site}</div>
    </div>
  </a>
</figure>`
}

export default function remarkLinkPreview({ cache: useCache = true } = {}) {
  return async(tree) => {
    const cache = useCache ? readCache() : {}
    const updates = {}
    const queue = []
    visit(tree, 'paragraph', (node, _index, parent) => {
      if (!parent || node.children?.length !== 1) return
      const child = node.children[0]
      const source = child.type === 'link' ? child.url : child.type === 'text' ? child.value.trim() : ''
      const url = /^https?:\/\/\S+$/i.test(source || '') ? httpUrl(source) : null
      if (!url) return
      queue.push((async() => {
        try {
          let meta = cache[url]
          if (!meta) {
            if (!pending.has(url)) {
              pending.set(url, fetchTextLimited(url)
                .then(result => extractMetaFromHtml(result.text, result.url))
                .finally(() => pending.delete(url)))
            }
            meta = await pending.get(url)
            updates[url] = meta
          }
          if (!meta.title && !meta.description && !meta.image) return
          const index = parent.children.indexOf(node)
          if (index >= 0) parent.children[index] = { type: 'html', value: generateHtml(url, meta) }
        } catch {
          // Keep the original link if the remote page is unavailable or unsuitable.
        }
      })())
    })
    await Promise.all(queue)
    if (useCache && Object.keys(updates).length) writeCache(updates)
  }
}
