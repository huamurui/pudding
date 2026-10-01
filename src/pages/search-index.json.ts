import { extractExcerptFromMarkdown, getPostUrl } from '@/utils/helpers'
import { getPublishedPosts } from '@/utils/content'

export async function GET() {
  const allPosts = await getPublishedPosts()
  const searchablePosts = allPosts.map((post) => ({
    id: post.id,
    title: post.data.title,
    excerpt: post.data.description || extractExcerptFromMarkdown(post.body || '') || '无摘要',
    url: getPostUrl(post.id),
    content: post.body || '',
    description: post.data.description,
    tags: post.data.tags
  }))

  return new Response(JSON.stringify(searchablePosts), {
    headers: {
      'Content-Type': 'application/json'
    }
  })
}
