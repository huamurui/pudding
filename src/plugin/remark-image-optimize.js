import { visit } from 'unist-util-visit'

export default function remarkImageOptimize() {
  return (tree) => {
    visit(tree, 'image', (node) => {
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
