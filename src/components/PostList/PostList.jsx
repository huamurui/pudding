import "./PostList.css";

// 即使传递的不是 getter 而是值, 只要加一个闭包包一下,而不是直接在 jsx 用似乎也可以保持响应式... 
// 看了看也不知道哪种更合理,但现在这样看起来简单些
// const PostList = (props) => {
//   const posts = () => props.posts || [];
const PostList = ({posts,selectedTags=null}) => {
  return (
    <>
      {posts().length === 0 ? (
        <p class="no-results">没有找到匹配的文章</p>
      ) : (
        <ul class="posts-list">
          {posts().map(post => (
            <li key={post.id} class="post-item">
              <a href={post.url} class="post-link">
                <span class="post-title">{post.title}</span>
                <span class="post-date">
                
                  {new Date(post.date).toLocaleDateString()}
                </span>
              </a>
              <div class="post-tags">
                {post.tags.map(tag => (
                  <span key={tag} class={`post-tag ${ selectedTags && selectedTags().has(tag) ? 'highlighted' : ''}`} >
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