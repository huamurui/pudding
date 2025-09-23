import "./PostList.css";

interface Post {
  id: string | number;
  url: string;
  title: string;
  date: string | Date;
  tags: string[];
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
                <span class="post-title">{post.title}</span>
                <span class="post-date">
                  {
                  () => {
                    const date = new Date(post.date);
                    const year = date.getFullYear();
                    const month = String(date.getMonth()).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");
                    return `${year}-${month}-${day}`;
                  }
                }
                </span>
              </a>
              <div class="post-tags">
                {post.tags.map(tag => (
                  <span
                    class={`post-tag ${selectedTags()?.has(tag) ? 'highlighted' : ''}`}
                  >
                    {tag}
                  </span>
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
