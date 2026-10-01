import assert from 'node:assert/strict'
import { readFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'
import ts from 'typescript'
import { remark } from 'remark'
import remarkSpoiler from '../src/plugin/remark-spoiler.js'
import remarkLinkPreview, { fetchTextLimited } from '../src/plugin/remark-link-preview.js'
import remarkImageOptimize from '../src/plugin/remark-image-optimize.js'
import remarkPostLinks from '../src/plugin/remark-post-links.js'
import { siteConfig } from '../src/config/site.config.ts'

// Execute the actual TypeScript sources with their Astro aliases resolved, without a bundler.
async function sourceModule(path, imports = {}) {
  const source = await readFile(new URL(`../${path}`, import.meta.url), 'utf8')
  const output = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext }
  }).outputText.replace(/(from\s+['"])([^'"]+)(['"])/g, (match, before, specifier, after) => {
    const url = imports[specifier]
    return url ? `${before}${url}${after}` : match
  })
  const url = `data:text/javascript;base64,${Buffer.from(output).toString('base64')}`
  return { url, exports: await import(url) }
}

const configUrl = new URL('../src/config/site.config.ts', import.meta.url).href
const helpersModule = await sourceModule('src/utils/helpers.ts', { '@/config/site.config': configUrl })
const helpers = helpersModule.exports
const astroContentUrl = `data:text/javascript,${encodeURIComponent('export const getCollection = async () => []')}`
const contentModule = await sourceModule('src/utils/content.ts', {
  'astro:content': astroContentUrl,
  './helpers': helpersModule.url
})

function withBase(t, base) {
  const previous = siteConfig.base
  siteConfig.base = base
  t.after(() => { siteConfig.base = previous })
}

function markdownTree(markdown) {
  return remark().parse(markdown)
}

function pluginHtml(tree) {
  return tree.children.map(node => node.type === 'html' ? node.value :
    (node.children || []).map(child => child.value || '').join('')).join('')
}

test('URL helpers preserve base paths, relative navigation and reserved characters', t => {
  withBase(t, '/blog/')
  assert.equal(helpers.buildUrl('./'), '/blog/')
  assert.equal(helpers.buildUrl('./about'), '/blog/about')
  assert.equal(helpers.buildUrl('https://example.com/a//b'), 'https://example.com/a//b')
  assert.equal(helpers.getPostUrl('tech/中文 #1'), '/blog/posts/tech/%E4%B8%AD%E6%96%87%20%231/')
  assert.equal(helpers.getTagRoutePath('C++/C#'), '~432b2b2f4323')
  assert.equal(helpers.getTagUrl('C++/C#'), '/blog/tags/~432b2b2f4323/')
  assert.notEqual(helpers.getTagUrl('#'), helpers.getTagUrl('%23'))
  assert.equal(helpers.getTagUrl('..'), '/blog/tags/~2e2e/')
  assert.notEqual(helpers.getTagRoutePath('#'), helpers.getTagRoutePath('~23'))
  for (const tag of ['.', '..', '%', '%2F', '/', 'back\\slash', '?', 'inner space']) {
    const uri = helpers.getTagUrl(tag)
    const pathname = new URL(uri, 'https://example.com').pathname
    assert.equal(decodeURIComponent(pathname.split('/').at(-2)), helpers.getTagRoutePath(tag))
  }
  assert.deepEqual(helpers.generateBreadcrumbItems('tech/nested/post').map(item => item.href), [
    '/blog/', '/blog/posts/tech/', '/blog/posts/tech/nested/', '/blog/posts/tech/nested/post/'
  ])
  assert.equal(helpers.isHomePage('/blog/'), true)
  assert.equal(helpers.isHomePage('/blog/index.html'), true)
  assert.equal(helpers.isPostPage('/blog/posts/tech/'), true)
  assert.equal(helpers.isPostPage('/blog/about/postscripts'), false)
  assert.notEqual(helpers.sanitizeViewTransitionName('中文'), helpers.sanitizeViewTransitionName('日记'))
})

test('post metadata rejects blank tags and normalizes duplicate labels', async() => {
  const collectionStub = `data:text/javascript;base64,${Buffer.from('export const defineCollection = value => value').toString('base64')}`
  const globStub = `data:text/javascript;base64,${Buffer.from('export const glob = () => ({})').toString('base64')}`
  const config = await sourceModule('src/content.config.ts', {
    'astro:content': collectionStub,
    'astro/loaders': globStub,
    'astro/zod': import.meta.resolve('astro/zod')
  })
  const schema = config.exports.collections.posts.schema
  assert.deepEqual(Object.keys(config.exports.collections), ['posts'])
  assert.equal(schema.safeParse({ title: 'Post', date: '2026-01-01', tags: ['   '] }).success, false)
  const post = schema.parse({ title: 'Post', date: '2026-01-01', tags: ['..', '   note   ', 'note', '%2F'] })
  assert.deepEqual(post.tags, ['..', 'note', '%2F'])
})

test('excerpts and reading counts handle attributed HTML and Chinese prose', () => {
  assert.equal(helpers.extractExcerptFromHtml('<p class="intro">Hello</p><p>Rest</p>'), '<p class="intro">Hello</p>')
  assert.equal(helpers.extractExcerptFromHtml('<h2>Short</h2>'), 'Short')
  assert.equal(helpers.extractExcerptFromMarkdown('```js\nconst x = 1\n\nignored code\n```\n\nActual **paragraph**.'), 'Actual paragraph.')
  assert.equal(helpers.calculateReadingTime(''), 0)
  assert.equal(helpers.calculateReadingTime('汉'.repeat(201)), 2)
  assert.throws(() => helpers.calculateReadingTime('hello', 0), RangeError)
})

test('directory generation handles prototype names and nested file-directory collisions', () => {
  const { buildDirectoryStructure, groupPostsByDirectory } = contentModule.exports
  const structure = buildDirectoryStructure(['constructor/a', '__proto__/b', 'tech', 'tech/nested/a'])
  assert.equal(structure.constructor.type, 'directory')
  assert.equal(structure.__proto__.children.b.type, 'file')
  assert.equal(structure.tech.children.nested.children.a.type, 'file')
  const posts = ['tech', 'tech/nested/a', 'other/b'].map(id => ({ id, data: {} }))
  const directories = groupPostsByDirectory(posts)
  assert.equal(directories.has('tech'), false)
  assert.deepEqual(directories.get('tech/nested').map(post => post.id), ['tech/nested/a'])
})

test('sitemap contains nested directories and tags without repeating deployment base', async t => {
  withBase(t, '/blog')
  const stubSource = `export const getPublishedPosts = async () => [{id:'tech/nested/a',data:{date:new Date('2026-01-01'),tags:['C++']}}]; export const groupPostsByDirectory = () => new Map([['tech', []], ['tech/nested', []]])`
  const stub = `data:text/javascript;base64,${Buffer.from(stubSource).toString('base64')}`
  const sitemap = await sourceModule('src/pages/sitemap.xml.ts', {
    '@/utils/content': stub,
    '@/utils/helpers': helpersModule.url,
    '@/config/site.config': configUrl
  })
  const xml = await (await sitemap.exports.GET()).text()
  assert.match(xml, /https:\/\/huamurui.github.io\/blog\/posts\/tech\/nested\/a\//)
  assert.match(xml, /https:\/\/huamurui.github.io\/blog\/posts\/tech\/nested\//)
  assert.match(xml, /https:\/\/huamurui.github.io\/blog\/tags\/C%2B%2B\//)
  assert.doesNotMatch(xml, /\/blog\/blog\//)
  assert.match(xml, /href="\/blog\/sitemap.xsl"/)
  assert.doesNotMatch(xml, /sasayai/i)
})

test('theme RSS and robots advertise the configured nonempty deployment base', async t => {
  withBase(t, '/pudding')
  const stubSource = `export const getPublishedPosts = async () => [{id:'tech/test',body:'A readable excerpt.',data:{title:'Article',date:new Date('2026-01-01'),tags:[]}}]`
  const stub = `data:text/javascript;base64,${Buffer.from(stubSource).toString('base64')}`
  const rssModule = await sourceModule('src/pages/rss.xml.ts', {
    '@astrojs/rss': import.meta.resolve('@astrojs/rss'),
    '@/utils/content': stub,
    '@/utils/helpers': helpersModule.url,
    '@/config/site.config': configUrl,
    '@/config/i18n.config': new URL('../src/config/i18n.config.ts', import.meta.url).href
  })
  const response = await rssModule.exports.GET({ site: new URL(siteConfig.site) })
  const xml = await response.text()
  assert.match(xml, /<link>https:\/\/huamurui.github.io\/pudding\/<\/link>/)
  assert.match(xml, /https:\/\/huamurui.github.io\/pudding\/posts\/tech\/test\//)
  assert.match(xml, /href="\/pudding\/rss.xsl"/)
  assert.match(xml, /<language>en-us<\/language>/)
  const robotsModule = await sourceModule('src/pages/robots.txt.ts', {
    '@/config/site.config': configUrl,
    '@/utils/helpers': helpersModule.url
  })
  const robots = await robotsModule.exports.GET({ site: new URL(siteConfig.site) })
  assert.match(await robots.text(), /Sitemap: https:\/\/huamurui.github.io\/pudding\/sitemap.xml/)
})

test('JSON-LD serialization preserves text without exposing HTML script delimiters', async() => {
  const structured = await sourceModule('src/utils/structured-data.ts', {
    '@/config/site.config': configUrl,
    './helpers': helpersModule.url
  })
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: '<!--<script>',
    description: '</script><img src=x> 中文 "quotes"',
    nested: { text: 'Before < after', values: ['Unicode: 云苔', '\\', '& >'] }
  }
  const json = structured.exports.serializeStructuredData(data)
  assert.doesNotMatch(json, /</)
  assert.match(json, /\\u003c/)
  assert.deepEqual(JSON.parse(json), data)
})

test('structured data includes deployment base in navigation and publisher assets', async t => {
  withBase(t, '/blog')
  const structured = await sourceModule('src/utils/structured-data.ts', {
    '@/config/site.config': configUrl,
    './helpers': helpersModule.url
  })
  const website = structured.exports.generateWebsiteStructuredData('https://example.com')
  assert.equal(website['@graph'][0].url, 'https://example.com/blog/')
  assert.equal(website['@graph'][0].publisher.logo.url, 'https://example.com/blog/favicon.svg')
  assert.equal(website['@graph'][2].url, 'https://example.com/blog/timeline')
  const post = structured.exports.generatePostStructuredData({ id: 'tech/post', data: {
    title: 'Post', date: new Date('2026-01-01'), tags: []
  } }, 'Description', 'https://example.com')
  assert.equal(post['@graph'][0].url, 'https://example.com/blog/posts/tech/post/')
  assert.equal(Object.hasOwn(post['@graph'][0], 'image'), false)
})

test('spoilers preserve alternating syntax in source order and escape decoded text', () => {
  const tree = markdownTree('Before ||first &amp; second|| then |||blackout||| and ||last|| after')
  remarkSpoiler()(tree)
  const html = pluginHtml(tree)
  assert.match(html, /data-mode="blur"[^>]*><span class="blur-content">first &amp; second<\/span>/)
  assert.match(html, /data-mode="blackout"[^>]*><span class="blur-content">blackout<\/span>/)
  assert.ok(html.indexOf('first &amp; second') < html.indexOf('blackout</span>'))
  assert.ok(html.indexOf('blackout</span>') < html.indexOf('last</span>'))
  assert.doesNotMatch(html, /\|\|/)
})

test('remote images preserve a safely escaped optional title', () => {
  const tree = markdownTree('![alt](https://example.com/a.png "Title & text")')
  remarkImageOptimize()(tree)
  assert.match(pluginHtml(tree), /title="Title &amp; text"/)
})

test('rich excerpts retain formatting while removing executable article content', async() => {
  const excerptModule = await sourceModule('src/utils/excerpt.ts', {
    'sanitize-html': import.meta.resolve('sanitize-html'),
    './helpers': helpersModule.url
  })
  const html = excerptModule.exports.createSafeExcerpt('<p><strong>Rich</strong> <a href="javascript:alert(1)">link</a><img src="https://example.com/a.png" onerror="alert(1)"><script>document.body.innerHTML="bad"</script><span class="katex" style="height:1em; background:url(javascript:evil)">math</span></p>')
  assert.match(html, /<strong>Rich<\/strong>/)
  assert.match(html, /class="katex"/)
  assert.match(html, /style="height:1em"/)
  assert.match(html, /src="https:\/\/example.com\/a.png"/)
  assert.doesNotMatch(html, /script|onerror|javascript:|background:|document.body/)
  const preview = excerptModule.exports.sanitizePostPreviewHtml('<h2 id="section">Title</h2><script>alert(1)</script><p onclick="bad()">Body</p>')
  assert.match(preview, /id="section"/)
  assert.doesNotMatch(preview, /script|onclick|alert/)
})

test('Markdown article links follow source files and custom slugs while draft labels remain unlinked', async t => {
  const postsDir = await mkdtemp(path.join(tmpdir(), 'pudding-links-'))
  t.after(() => rm(postsDir, { recursive: true, force: true }))
  await mkdir(path.join(postsDir, 'diary'))
  await mkdir(path.join(postsDir, 'tech'))
  await writeFile(path.join(postsDir, 'diary/source.md'), '---\ntitle: Source\n---\nSource')
  await writeFile(path.join(postsDir, 'diary/notes.md'), '---\ntitle: Notes\nslug: custom-note\n---\nNotes')
  await writeFile(path.join(postsDir, 'tech/index.md'), '---\ntitle: Tech\n---\nTech')
  await writeFile(path.join(postsDir, 'tech/draft.md'), '---\ntitle: Draft\ndraft: true\nslug: draft/custom\n---\nDraft')
  const tree = markdownTree('[note](./notes.md?mode=1#人与物) [tech](../tech/index.md) [**draft**](../tech/draft.md) [asset](./file.pdf) [reference][ref]\n\n[ref]: ../tech/draft.md')
  remarkPostLinks({ postsDir, base: '/blog/' })(tree, { path: path.join(postsDir, 'diary/source.md') })
  const links = tree.children[0].children.filter(node => node.type === 'link')
  assert.deepEqual(links.map(node => node.url), ['/blog/posts/custom-note/?mode=1#人与物', '/blog/posts/tech/', './file.pdf'])
  assert.equal(tree.children[0].children.some(node => node.type === 'emphasis' || node.type === 'strong'), true)
  assert.equal(tree.children[0].children.some(node => node.type === 'linkReference'), false)
})

test('link cards accept reversed metadata attributes and resolve redirected image paths', async t => {
  const originalFetch = globalThis.fetch
  t.after(() => { globalThis.fetch = originalFetch })
  globalThis.fetch = async () => {
    const response = new Response('<title>Fallback</title><meta content="A &amp; B" property="og:title"><meta content="../image.png" property="og:image"><meta content="Description" name="description">', { headers: { 'Content-Type': 'text/html' } })
    Object.defineProperty(response, 'url', { value: 'https://example.com/redirect/page/' })
    return response
  }
  const tree = markdownTree('<https://example.com/original?one=1&two=2>')
  await remarkLinkPreview({ cache: false })(tree)
  const html = pluginHtml(tree)
  assert.match(html, /href="https:\/\/example.com\/original\?one=1&amp;two=2"/)
  assert.match(html, />A &amp; B<\/h4>/)
  assert.match(html, /src="https:\/\/example.com\/redirect\/image.png"/)
})

test('link cards discard unsafe metadata image URLs', async t => {
  const originalFetch = globalThis.fetch
  t.after(() => { globalThis.fetch = originalFetch })
  globalThis.fetch = async () => new Response('<title>Safe</title><meta property="og:image" content="javascript:alert(1)">', { headers: { 'Content-Type': 'text/html' } })
  const tree = markdownTree('<https://example.com/unsafe-image>')
  await remarkLinkPreview({ cache: false })(tree)
  assert.doesNotMatch(pluginHtml(tree), /<img|javascript:/)
})

test('preview fetch timeout remains active while reading the body', async t => {
  const originalFetch = globalThis.fetch
  t.after(() => { globalThis.fetch = originalFetch })
  globalThis.fetch = async (_url, { signal }) => new Response(new ReadableStream({
    start(controller) {
      signal.addEventListener('abort', () => controller.error(new Error('aborted')), { once: true })
    }
  }), { headers: { 'Content-Type': 'text/html' } })
  await assert.rejects(fetchTextLimited('https://example.com/stalled', 20), /aborted/)
})

test('oversized streamed previews cancel their response body', async t => {
  const originalFetch = globalThis.fetch
  t.after(() => { globalThis.fetch = originalFetch })
  let cancelled = false
  globalThis.fetch = async () => new Response(new ReadableStream({
    start(controller) { controller.enqueue(new Uint8Array(32)) },
    cancel() { cancelled = true }
  }), { headers: { 'Content-Type': 'text/html' } })
  await assert.rejects(fetchTextLimited('https://example.com/large', 100, 16), /too large/)
  assert.equal(cancelled, true)
})
