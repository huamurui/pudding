import { getCollection, type CollectionEntry } from 'astro:content';
import type { APIRoute } from 'astro';

interface PostData {
  id: string;
  title: string;
  date?: Date;
  description?: string;
  tags: string[];
  url: string;
}

interface TagCount {
  name: string;
  count: number;
}

interface ApiResponse {
  posts: PostData[];
  tags: TagCount[];
}

export const GET: APIRoute = async () => {
  const allBlogPosts: CollectionEntry<'posts'>[] = await getCollection('posts');

  // 用于统计标签的Map
  const tagCountMap: Map<string, number> = new Map();

  const postsData: PostData[] = allBlogPosts.map(post => {
    // 处理标签，确保是数组格式
    const tags: string[] = Array.isArray(post.data.tags)
      ? post.data.tags
      : (post.data.tags ? [post.data.tags] : []);

    // 更新标签计数
    tags.forEach(tag => {
      if (tagCountMap.has(tag)) {
        tagCountMap.set(tag, tagCountMap.get(tag)! + 1);
      } else {
        tagCountMap.set(tag, 1);
      }
    });

    return {
      id: post.id,
      title: post.data.title,
      date: post.data.date,
      description: post.data.description,
      tags: tags,
      url: `/posts/${post.id}/`,
    };
  });

  postsData.sort((a, b) => {
    const dateA = a.date ? new Date(a.date) : new Date(0);
    const dateB = b.date ? new Date(b.date) : new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  const tags: TagCount[] = Array.from(tagCountMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count); 

  const responseData: ApiResponse = {
    posts: postsData,
    tags: tags
  };

  return new Response(JSON.stringify(responseData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
