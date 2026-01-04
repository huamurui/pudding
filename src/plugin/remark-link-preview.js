import { visit } from 'unist-util-visit';
import fs from 'fs';
import path from 'path';

const TIMEOUT = 7000;
const MAX_BYTES = 200 * 1024; // 200 KB
const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'link-previews.json');

function ensureCache() {
  try {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
    if (!fs.existsSync(CACHE_FILE)) fs.writeFileSync(CACHE_FILE, JSON.stringify({}), 'utf-8');
  } catch (e) {
    // ignore
  }
}

function readCache() {
  try {
    ensureCache();
    const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    return {};
  }
}

function writeCache(cache) {
  try {
    ensureCache();
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (e) {
    // ignore
  }
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function extractMetaFromHtml(html, url) {
  const meta = { title: null, description: null, image: null, site: null };
  try {
    // title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) meta.title = titleMatch[1].trim();

    // meta tags (og: and name=description)
    const metaRe = /<meta\s+[^>]*(?:property|name)=["']([^"']+)["'][^>]*content=["']([^"']+)["'][^>]*>/gi;
    let m;
    while ((m = metaRe.exec(html))) {
      const key = m[1].toLowerCase();
      const value = m[2].trim();
      if (!meta.title && (key === 'og:title')) meta.title = value;
      if (!meta.description && (key === 'og:description' || key === 'description')) meta.description = value;
      if (!meta.image && (key === 'og:image' || key === 'twitter:image')) meta.image = value;
    }

    // fallback: short description from meta name=description
    if (!meta.description) {
      const descMatch = html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
      if (descMatch) meta.description = descMatch[1].trim();
    }

    // site as hostname
    try {
      meta.site = new URL(url).hostname.replace(/^www\./, '');
    } catch (e) {
      meta.site = url;
    }
  } catch (e) {
    // ignore
  }
  return meta;
}

async function fetchTextLimited(url, timeout = TIMEOUT, maxBytes = MAX_BYTES) {
  // prefer global fetch if available
  const fetchFn = globalThis.fetch?.bind(globalThis);
  if (!fetchFn) {
    // try dynamic import of node-fetch
    const nodeFetch = await import('node-fetch');
    if (nodeFetch && nodeFetch.default) {
      return nodeFetch.default(url, { timeout }).then(r => r.text());
    }
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const res = await fetchFn(url, { signal: controller.signal, headers: { 'User-Agent': 'astro-link-preview/1.0' } });
  clearTimeout(id);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) throw new Error('not html');

  // try to respect content-length
  const len = res.headers.get('content-length');
  if (len && Number(len) > maxBytes) throw new Error('too large');

  // if streaming available, read up to maxBytes
  if (res.body && typeof res.body.getReader === 'function') {
    const reader = res.body.getReader();
    let received = 0;
    let chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.length || value.byteLength || 0;
      chunks.push(Buffer.from(value));
      if (received > maxBytes) break;
    }
    return Buffer.concat(chunks).toString('utf-8');
  }

  // fallback to full text but slice
  const text = await res.text();
  return text.slice(0, maxBytes);
}

export default function remarkLinkPreview() {
  return async (tree, vfile) => {
    const cache = readCache();
    const queue = [];

    visit(tree, 'paragraph', (node, index, parent) => {
      if (!parent || !Array.isArray(node.children)) return;
      if (node.children.length !== 1) return;
      const child = node.children[0];
      let url = null;

      if (child.type === 'link' && child.url) {
        url = child.url;
      } else if (child.type === 'text') {
        const m = child.value.trim().match(/^(https?:\/\/\S+)$/);
        if (m) url = m[1];
      }

      if (!url) return;

      // enqueue async replacement
      queue.push((async () => {
        try {
          if (cache[url]) {
            const meta = cache[url];
            if (meta && (meta.title || meta.description || meta.image)) {
              const html = generateHtml(url, meta);
              parent.children[index] = { type: 'html', value: html };
            }
            return;
          }

          const text = await fetchTextLimited(url).catch(() => null);
          if (!text) return;
          const meta = extractMetaFromHtml(text, url);
          if (!meta.title && !meta.description && !meta.image) {
            cache[url] = { fetched: true, title: null, description: null, image: null, site: meta.site };
            writeCache(cache);
            return;
          }

          cache[url] = { fetched: true, ...meta };
          writeCache(cache);

          const html = generateHtml(url, meta);
          parent.children[index] = { type: 'html', value: html };
        } catch (e) {
          // ignore failures
          return;
        }
      })());
    });

    await Promise.all(queue);
  };
}

function generateHtml(url, meta) {
  const title = escapeHtml(meta.title || url);
  const description = meta.description ? escapeHtml(meta.description) : '';
  const image = meta.image ? escapeHtml(meta.image) : null;
  const site = escapeHtml(meta.site || new URL(url).hostname);

  const imgHtml = image ? `<div class="link-card__img-wrapper"><img class="link-card__img" src="${image}" alt="${title}" loading="lazy"></div>` : '';

  return `
<figure class="link-card">
  <a class="link-card__link" href="${url}" target="_blank" rel="noopener noreferrer">
    ${imgHtml}
    <div class="link-card__body">
      <h4 class="link-card__title">${title}</h4>
      ${description ? `<p class="link-card__desc">${description}</p>` : ''}
      <div class="link-card__meta">${site}</div>
    </div>
  </a>
</figure>`;
}
