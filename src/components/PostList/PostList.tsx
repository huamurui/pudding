// PostList.tsx
import "./PostList.css";

interface Post {
  id: string;
  data: {
    title: string;
    date: string | Date;
    tags: string[];
  };
}

interface PostListProps {
  posts: () => Post[];
  selectedTags?: () => Set<string> | null;
  transition?: any;
}

const PostList = ({ posts, selectedTags = () => null, transition }: PostListProps) => {
  return (
    <>
      {posts().length === 0 ? (
        <p class="no-results">没有找到匹配的文章</p>
      ) : (
        <ul class="posts-list">
          {posts().map((post) => {
            const safeId = String(post.id).replace(/[^a-zA-Z0-9_-]/g, '-');
            return (
            <article class="timeline-post">
              <div class="post-content">
                <div class="post-info">
                  <time class="post-date">
                    {new Date(post.data.date)
                      .toISOString()
                      .split("T")[0]
                      .split("-")
                      .slice(1)
                      .join("-")}
                  </time>

                  <div class="timeline-connector">
                    <div class="post-marker" />
                  </div>

                  <a href={`/posts/${post.id}`} class="post-link">
                    <h5 {...{style:{ "view-transition-name": `post-${String(post.id).replace(/[^a-zA-Z0-9_-]/g, '-')}`}}} class="post-title">{post.data.title}</h5>
                  </a>

                  <div class="post-tags">
                    {post.data.tags?.map((t: string) => (
                      <a href={`/tags/${t}`} class="inline-tag">
                        #{t}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          )})}
        </ul>
      )}
    </>
  );
};

export default PostList;