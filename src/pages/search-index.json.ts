import { getCollection } from 'astro:content';
import { buildUrl } from '@/utils/helpers';

export async function GET() {
  const allPosts = await getCollection('posts');
  const searchablePosts = allPosts.map((post) => ({
    id: post.id,
    title: post.data.title,
    excerpt: post.data.description || '无摘要',
    url: buildUrl(['posts', post.id, '']),
    content: post.body || '',
    description: post.data.description,
    tags: post.data.tags
  }));

  return new Response(JSON.stringify(searchablePosts), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
