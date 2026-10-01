import { visit } from 'unist-util-visit'
import { createPostPathData, resolveLocalPostId } from '../../scripts/post-paths.mjs'

/** Resolve article links against Markdown source files before directory routes change their base URL. */
export default function remarkPostLinks({ postsDir, base = '' } = {}) {
  return (tree, file) => {
    const sourceFile = file.path
    if (!sourceFile) return
    const { postIds, draftIds } = createPostPathData(postsDir)
    const resolve = url => {
      const id = resolveLocalPostId(url, sourceFile, postIds, { postsDir, base })
      if (id === null) return null
      const suffixIndex = url.search(/[?#]/)
      const suffix = suffixIndex >= 0 ? url.slice(suffixIndex) : ''
      const prefix = `/${base}`.replace(/\/+/g, '/').replace(/\/$/, '')
      const href = `${prefix}/posts/${id.split('/').map(encodeURIComponent).join('/')}/${suffix}`
      return { href, draft: draftIds.has(id) }
    }
    const definitions = new Map()
    visit(tree, 'definition', node => {
      const target = resolve(node.url)
      if (target) {
        definitions.set(node.identifier, target)
        if (!target.draft) node.url = target.href
      }
    })
    visit(tree, ['link', 'linkReference'], (node, index, parent) => {
      const target = node.type === 'link' ? resolve(node.url) : definitions.get(node.identifier)
      if (!target) return
      if (target.draft) {
        if (!parent || typeof index !== 'number') return
        // Keep the visible, formatted label while omitting the unpublished article URL.
        parent.children.splice(index, 1, ...node.children)
        return index + node.children.length
      }
      if (node.type === 'link') node.url = target.href
    })
  }
}
