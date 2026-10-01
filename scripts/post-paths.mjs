import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { globSync } from 'glob'
import { slug } from 'github-slugger'
import { parseFrontmatter } from '@astrojs/markdown-remark'

export const postsRoot = fileURLToPath(new URL('../src/posts/', import.meta.url))

export function loadPostEntries(postsDir = postsRoot) {
  if (!fs.statSync(postsDir).isDirectory()) throw new Error(`Posts directory not found: ${postsDir}`)
  const entries = []
  const ids = new Set()
  // Match Astro's Markdown collection and default glob ID generation.
  for (const file of globSync('**/*.md', { cwd: postsDir, nodir: true }).sort()) {
    const filePath = path.resolve(postsDir, file)
    const { frontmatter, content } = parseFrontmatter(fs.readFileSync(filePath, 'utf8'))
    const id = frontmatter.slug ? String(frontmatter.slug)
      : file.replace(/\.md$/, '').split(/[\\/]/).map(segment => slug(segment)).join('/').replace(/\/index$/, '')
    if (ids.has(id)) throw new Error(`Duplicate article ID: ${id}`)
    ids.add(id)
    entries.push({ filePath, id, content, draft: frontmatter.draft === true })
  }
  return entries
}

export function createPostIdMap(postsDir = postsRoot) {
  return createPostPathData(postsDir).postIds
}

export function createPostPathData(postsDir = postsRoot) {
  const entries = loadPostEntries(postsDir)
  return {
    postIds: new Map(entries.map(({ filePath, id }) => [filePath, id])),
    draftIds: new Set(entries.filter(entry => entry.draft).map(entry => entry.id))
  }
}

export function resolveLocalPostId(url, sourceFile, postIdMap, { postsDir = postsRoot, base = '' } = {}) {
  if (!url || /^(?:[a-z][a-z\d+.-]*:|\/\/|#|\?)/i.test(url)) return null
  let pathname
  try {
    pathname = decodeURIComponent(url.split(/[?#]/, 1)[0])
  } catch {
    return null
  }
  if (!pathname || /[\\\0]/.test(pathname) || pathname.startsWith('//')) return null

  const postPrefix = `${base.replace(/\/$/, '')}/posts/`
  if (pathname.startsWith(postPrefix)) {
    const routeId = pathname.slice(postPrefix.length).replace(/(?:\/index)?\.html$/, '').replace(/\/$/, '')
    if ([...postIdMap.values()].includes(routeId)) return routeId
    pathname = `/${routeId}`
  }
  const targetPath = pathname.startsWith('/')
    ? path.resolve(postsDir, pathname.slice(1))
    : path.resolve(path.dirname(sourceFile), pathname)
  const relative = path.relative(postsDir, targetPath)
  if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return null
  const extensionless = targetPath.replace(/\.(?:md|mdx|html)$/, '')
  return postIdMap.get(targetPath)
    ?? postIdMap.get(`${extensionless}.md`)
    ?? postIdMap.get(path.join(extensionless, 'index.md'))
    ?? null
}
