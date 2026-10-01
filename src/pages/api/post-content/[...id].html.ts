import { render } from 'astro:content'
import { experimental_AstroContainer } from 'astro/container'
import { getPublishedPosts, groupPostsByDirectory } from '@/utils/content'
import { formatDate } from '@/utils/helpers'
import { sanitizePostPreviewHtml } from '@/utils/excerpt'

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function getStaticPaths() {
  const posts = await getPublishedPosts()

  return [...posts.map(post => post.id), ...groupPostsByDirectory(posts).keys()]
    .map(id => ({ params: { id } }))
}

export async function GET({ params }: { params: { id: string } }) {
  const posts = await getPublishedPosts()
  const cleanId = params.id

  const post = posts.find(p => p.id === cleanId)
  if (post) {
    try {
      const container = await experimental_AstroContainer.create()
      const { Content } = await render(post)
      const html = sanitizePostPreviewHtml(await container.renderToString(Content))

      const wrappedHtml = `<div id="preview-wrapper" data-title="${escapeHtml(post.data.title)}" data-date="${post.data.date.toISOString()}">${html}</div>`

      return new Response(wrappedHtml, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache'
        }
      })
    } catch (e) {
      return new Response(`Rendering failed: ${(e as Error).message}`, { status: 500 })
    }
  }

  // Check if it's a category
  const categoryPosts = posts.filter(p => p.id.startsWith(`${cleanId}/`))
  if (categoryPosts.length > 0) {
    const categoryTitle = cleanId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    const sorted = categoryPosts.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())

    let html = '<div style="padding: 0 8px;">'
    html += '<ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px;">'
    for (const p of sorted) {
      html += `<li>
        <div style="font-weight: 600; font-size: 1.05em; color: var(--text-primary); margin-bottom: 2px;">${escapeHtml(p.data.title)}</div>
        <div style="font-size: 0.85em; color: var(--text-muted);">${formatDate(p.data.date)}</div>
      </li>`
    }
    html += '</ul></div>'

    const wrappedHtml = `<div id="preview-wrapper" data-title="Category: ${escapeHtml(categoryTitle)}" data-date="">${html}</div>`

    return new Response(wrappedHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache'
      }
    })
  }

  return new Response('Post or category not found', { status: 404 })
}
