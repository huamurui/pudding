import type { FuseResult, IFuseOptions } from 'fuse.js'

export interface SearchPost {
  id: string
  title: string
  url: string
  content?: string
  description?: string
  tags?: string[]
}

export type SearchWorkerMessage = {
  type: 'INIT'
  payload: { posts: SearchPost[]; options: IFuseOptions<SearchPost> }
} | {
  type: 'SEARCH'
  payload: { query: string; requestId: number }
}

export type SearchWorkerResponse = {
  type: 'INITIALIZED'
} | {
  type: 'SEARCH_RESULTS'
  payload: FuseResult<SearchPost>[]
  requestId: number
} | {
  type: 'ERROR'
  payload: string
}

/** Return plain text segments; the renderer, rather than HTML injection, handles escaping. */
export function highlightSegments(text: string, query: string): Array<{ text: string; matched: boolean }> {
  if (!query) return [{ text, matched: false }]
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.split(new RegExp(`(${escaped})`, 'gi'))
    .map((part, index) => ({ text: part, matched: index % 2 === 1 }))
}

export function generateExcerpt(post: SearchPost, query: string): string {
  const content = post.content || ''
  const matchIndex = query ? content.toLowerCase().indexOf(query.toLowerCase()) : -1
  if (matchIndex === -1) {
    return post.description || content.slice(0, 150) + (content.length > 150 ? '…' : '')
  }
  const start = Math.max(0, matchIndex - 50)
  const end = Math.min(content.length, matchIndex + query.length + 50)
  return `${start > 0 ? '…' : ''}${content.slice(start, end)}${end < content.length ? '…' : ''}`
}
