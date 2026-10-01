import assert from 'node:assert/strict'
import test from 'node:test'
import { activePreviewCount } from '../src/scripts/preview-state.ts'
import { resolveCanonicalUrl } from '../src/scripts/canonical.ts'
import { breadcrumbDirectoryPath } from '../src/scripts/breadcrumb.ts'
import { generateExcerpt, highlightSegments } from '../src/scripts/search.ts'

test('search highlights literal punctuation and keeps HTML content as plain text segments', () => {
  for (const query of ['[', '(', '\\', '.*', '<img', '$']) {
    const source = `prefix ${query} suffix ${query.toUpperCase()}`
    const segments = highlightSegments(source, query)
    assert.equal(segments.map(part => part.text).join(''), source)
    assert.equal(segments.filter(part => part.matched).length, 2)
    assert.ok(segments.filter(part => part.matched).every(part => part.text.toLowerCase() === query.toLowerCase()))
  }
  const markup = '<img src=x onerror=alert(1)>'
  assert.deepEqual(highlightSegments(markup, ''), [{ text: markup, matched: false }])
  assert.equal(generateExcerpt({ id: 'initial', title: 'Title', url: '/posts/initial' }, '['), '')
})

test('search excerpts preserve and highlight matched Chinese content', () => {
  const post = { id: 'post', title: 'Title', url: '/posts/post', content: '前'.repeat(100) + '中文关键词' + '后'.repeat(100) }
  const excerpt = generateExcerpt(post, '关键词')
  assert.ok(excerpt.startsWith('…'))
  assert.ok(excerpt.endsWith('…'))
  assert.equal(highlightSegments(excerpt, '关键词').find(part => part.matched).text, '关键词')
})

test('breadcrumb directories preserve URL case, Unicode, and base prefixes', () => {
  assert.equal(breadcrumbDirectoryPath('/blog/posts/Tech/', '/blog/posts'), 'Tech')
  assert.equal(breadcrumbDirectoryPath('/blog/posts/%E4%B8%AD%E6%96%87/Nested', '/blog/posts'), '中文/Nested')
  assert.equal(breadcrumbDirectoryPath('/blog/', '/blog/posts'), '')
  assert.equal(breadcrumbDirectoryPath('/blog/posts-other/Tech', '/blog/posts'), '')
  assert.equal(breadcrumbDirectoryPath('/blog/posts/%broken', '/blog/posts'), '%broken')
})

test('search worker initializes, bounds results, and echoes request IDs for stale-response protection', async() => {
  const responses = []
  const previousSelf = globalThis.self
  const worker = { postMessage: response => responses.push(response) }
  globalThis.self = worker
  try {
    await import('../src/workers/search-worker.ts')
    worker.onmessage({ data: { type: 'SEARCH', payload: { query: 'article', requestId: 1 } } })
    assert.equal(responses.pop().type, 'ERROR')
    const posts = Array.from({ length: 8 }, (_, index) => ({ id: String(index), title: `article ${index}`, url: `/posts/${index}` }))
    worker.onmessage({ data: { type: 'INIT', payload: { posts, options: { keys: ['title'] } } } })
    assert.equal(responses.pop().type, 'INITIALIZED')
    worker.onmessage({ data: { type: 'SEARCH', payload: { query: 'article', requestId: 42 } } })
    const response = responses.pop()
    assert.equal(response.type, 'SEARCH_RESULTS')
    assert.equal(response.requestId, 42)
    assert.equal(response.payload.length, 5)
  } finally {
    if (previousSelf === undefined) delete globalThis.self
    else globalThis.self = previousSelf
  }
})


test('nested preview hover keeps every ancestor open and closes only inactive descendants', () => {
  const inactive = { isHovered: false, isLinkHovered: false }
  assert.equal(activePreviewCount([inactive, inactive, { isHovered: true, isLinkHovered: false }]), 3)
  assert.equal(activePreviewCount([{ isHovered: false, isLinkHovered: true }, inactive, inactive]), 1)
  assert.equal(activePreviewCount([inactive, inactive]), 0)
})

test('frontmatter canonical links resolve absolute and relative HTTP URLs and reject invalid schemes', () => {
  const site = new URL('https://example.com/blog/')
  const fallback = 'https://example.com/posts/current'
  assert.equal(resolveCanonicalUrl('https://original.example/p', site, fallback), 'https://original.example/p')
  assert.equal(resolveCanonicalUrl('/posts/other', site, fallback), 'https://example.com/posts/other')
  assert.equal(resolveCanonicalUrl('relative', site, fallback), 'https://example.com/blog/relative')
  assert.equal(resolveCanonicalUrl('http://original.example/p', site, fallback), 'http://original.example/p')
  for (const invalid of ['javascript:alert(1)', 'data:text/html,example', 'ftp://example.com/file', 'http://[', ' ']) {
    assert.equal(resolveCanonicalUrl(invalid, site, fallback), fallback)
  }
})
