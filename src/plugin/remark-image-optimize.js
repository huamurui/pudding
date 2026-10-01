import { visit } from 'unist-util-visit'

export default function remarkImageOptimize() {
  return (tree) => {
    visit(tree, 'image', (node) => {
      // Astro's image pipeline serializes remote image metadata into the rendered
      // body. Rendering the same entry through AstroContainer and a page can then
      // make that metadata get parsed twice. Remote images cannot be optimized at
      // build time anyway, so emit a normal lazy-loading image for those URLs.
      if (/^https?:\/\//i.test(node.url)) {
        const src = escapeAttribute(node.url)
        const alt = escapeAttribute(node.alt || '')
        const title = node.title ? ` title="${escapeAttribute(node.title)}"` : ''
        node.type = 'html'
        node.value = `<img src="${src}" alt="${alt}"${title} loading="lazy" decoding="async" class="post-content-image">`
        return
      }

      // Ensure we have data property
      node.data = node.data || {}
      node.data.hProperties = node.data.hProperties || {}

      // Add loading="lazy" and decoding="async"
      node.data.hProperties.loading = 'lazy'
      node.data.hProperties.decoding = 'async'

      // Add a class for styling and medium-zoom targeting
      node.data.hProperties.class = 'post-content-image'
    })
  }
}

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
