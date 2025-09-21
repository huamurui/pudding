// src/data/all-posts.json.js
import { getCollection } from 'astro:content';

export async function GET() {
  const allBlogPosts = await getCollection('posts');
  
  // 用于统计标签的Map
  const tagCountMap = new Map();
  
  const postsData = allBlogPosts.map(post => {
    // 处理标签，确保是数组格式
    const tags = Array.isArray(post.data.tags) 
      ? post.data.tags 
      : (post.data.tag ? [post.data.tag] : []);
    
    // 更新标签计数
    tags.forEach(tag => {
      if (tagCountMap.has(tag)) {
        tagCountMap.set(tag, tagCountMap.get(tag) + 1);
      } else {
        tagCountMap.set(tag, 1);
      }
    });
    
    return {
      id: post.id,
      title: post.data.title,
      date: post.data.date?.toISOString(),
      description: post.data.description,
      tags: tags,
      url: `/posts/${post.slug || post.id}/`,
    };
  });
  
  // 按日期排序
  postsData.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // 将标签Map转换为排序后的数组
  const tags = Array.from(tagCountMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count); // 按使用次数降序排列
  
  return new Response(JSON.stringify({
    posts: postsData,
    tags: tags
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}