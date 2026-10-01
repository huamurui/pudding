import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { remark } from 'remark'
import { visit } from 'unist-util-visit'
import { loadPostEntries, resolveLocalPostId } from './post-paths.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))

export function buildBacklinks({
  postsDir = path.join(root, 'src/posts'),
  outputFile = path.join(root, '.cache/backlinks.json'),
  base = ''
} = {}) {
  const entries = loadPostEntries(postsDir).filter(entry => !entry.draft)
  const postIdMap = new Map(entries.map(({ filePath, id }) => [filePath, id]))
  const backlinks = new Map()

  for (const { filePath, id: sourceId, content } of entries) {
    const tree = remark.parse(content)
    const definitions = new Map()
    visit(tree, 'definition', node => {
      if (!definitions.has(node.identifier)) definitions.set(node.identifier, node.url)
    })
    visit(tree, node => {
      const url = node.type === 'link' ? node.url
        : node.type === 'linkReference' ? definitions.get(node.identifier) : null
      if (!url) return
      const targetId = resolveLocalPostId(url, filePath, postIdMap, { postsDir, base })
      if (!targetId || targetId === sourceId) return
      if (!backlinks.has(targetId)) backlinks.set(targetId, new Set())
      backlinks.get(targetId).add(sourceId)
    })
  }

  const data = Object.fromEntries([...backlinks].sort(([a], [b]) => a.localeCompare(b))
    .map(([id, sources]) => [id, [...sources].sort()]))
  fs.mkdirSync(path.dirname(outputFile), { recursive: true })
  // A same-directory rename prevents consumers from reading an incomplete JSON file.
  const temporary = `${outputFile}.${process.pid}.tmp`
  try {
    fs.writeFileSync(temporary, `${JSON.stringify(data, null, 2)}\n`)
    fs.renameSync(temporary, outputFile)
  } finally {
    fs.rmSync(temporary, { force: true })
  }
  return data
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { siteConfig } = await import(new URL('../src/config/site.config.ts', import.meta.url))
    const data = buildBacklinks({ base: siteConfig.base })
    console.log(`Generated backlinks for ${Object.keys(data).length} articles`)
  } catch (error) {
    console.error(`Failed to generate backlinks: ${error.message}`)
    process.exitCode = 1
  }
}
