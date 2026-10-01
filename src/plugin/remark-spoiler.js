import { visit } from 'unist-util-visit'

function escapeHtml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Convert ||text|| and |||text||| in source order without consuming later text twice. */
export default function remarkBlurText() {
  return (tree) => {
    visit(tree, 'text', (node, index, parent) => {
      if (!parent || typeof index !== 'number') return
      const pattern = /(\|\|\||\|\|)([^|]+)\1/g
      const children = []
      let lastIndex = 0
      let match
      while ((match = pattern.exec(node.value)) !== null) {
        if (match.index > lastIndex) {
          children.push({ type: 'text', value: node.value.slice(lastIndex, match.index) })
        }
        const mode = match[1].length === 3 ? 'blackout' : 'blur'
        children.push({
          type: 'html',
          value: `<span class="blur-wrapper" data-mode="${mode}" data-hidden="true" role="button" tabindex="0" aria-expanded="false"><span class="blur-content">${escapeHtml(match[2].trim())}</span></span>`
        })
        lastIndex = match.index + match[0].length
      }
      if (!children.length) return
      if (lastIndex < node.value.length) children.push({ type: 'text', value: node.value.slice(lastIndex) })
      parent.children.splice(index, 1, ...children)
      // Skip the inserted nodes, including ordinary text that may contain unmatched delimiters.
      return index + children.length
    })
  }
}
