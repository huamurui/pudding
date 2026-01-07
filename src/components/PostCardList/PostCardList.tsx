// PostCardList.tsx
import "./PostCardList.css";
import { formatDate, sanitizeViewTransitionName, getTagUrl } from "../../utils/helpers";
import type { PostData } from "../../types";

interface Post extends PostData {}

interface PostCardListProps {
  posts: () => Post[];
  selectedTags?: () => Set<string> | null;
  transition?: any;
}

const PostCardList = ({ posts, selectedTags = () => null, transition }: PostCardListProps) => {
  return (
    <>
      {posts().length === 0 ? (
        <p class="no-results">没有找到匹配的文章</p>
      ) : (
        <ul class="posts-list">
          {posts().map((post, index) => (
            <li class="post-item-con">
              <div class="post-item">
                <a href={post.url} class="post-link">
                  <h2 {...{style:{ "view-transition-name": sanitizeViewTransitionName(post.id)}}} class="post-title">{post.title}</h2>
                  <time class="post-date" datetime={new Date(post.date).toISOString()}>
                    {formatDate(post.date)}
                  </time>
                </a>

                {/* 渲染摘要 */}
                <div class="post-excerpt" innerHTML={post.excerptHtml} />

                <div class="post-tags">
                  {post.tags.map(tag => (
                    <a
                      href={getTagUrl(tag)}
                      class={`post-tag ${selectedTags()?.has(tag) ? 'highlighted' : ''}`}
                    >
                      #{tag}
                    </a>
                  ))}
                </div>
              </div>
              {/* 分割线 - 最后一项不显示 */}
              {index !== posts().length - 1 && <div class="divider"></div>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

export default PostCardList;