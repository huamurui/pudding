import "./PostList.css";

interface Post {
  id: string;
  url: string;
  title: string;
  date: string | Date;
  tags: string[];
  description?: string;
  excerptHtml: string; // 渲染后的摘要HTML
}

interface PostListProps {
  posts: () => Post[];
  selectedTags?: () => Set<string> | null;
}

const PostList = ({ posts, selectedTags = () => null }: PostListProps) => {
  return (
    <>
      {posts().length === 0 ? (
        <p class="no-results">没有找到匹配的文章</p>
      ) : (
        <ul class="posts-list">
          {posts().map(post => (
            <li class="post-item">
              <a href={post.url} class="post-link">
                <h2 class="post-title">{post.title}</h2>
                <time class="post-date" datetime={new Date(post.date).toISOString()}>
                  {new Date(post.date).toISOString().split('T')[0]}
                </time>
              </a>
              
              {/* 渲染摘要（复用正文样式） */}
              <div class="post-excerpt" innerHTML={post.excerptHtml} />
              
              <div class="post-tags">
                {post.tags.map(tag => (
                  <a 
                    href={`/tags/${tag}`} 
                    class={`post-tag ${selectedTags()?.has(tag) ? 'highlighted' : ''}`}
                  >
                    #{tag}
                  </a>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

export default PostList;
