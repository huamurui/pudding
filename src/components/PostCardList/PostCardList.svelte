<!-- PostCardList.svelte -->
<script>
  import { sanitizeViewTransitionName, getTagUrl } from "../../utils/helpers";
  import { formatDate } from "../../utils/helpers";
  import "./PostCardList.css";

  export let posts = [];
  export let selectedTags = null;

  const postsArr = typeof posts === 'function' ? posts() : posts || [];
</script>

{#if postsArr.length === 0}
  <p class="no-results">没有找到匹配的文章</p>
{:else}
  <ul class="posts-list">
    {#each postsArr as post, index (post.id)}
      <li class="post-item-con">
        <div class="post-item">
          <a href={post.url} class="post-link">
            <h2 
              class="post-title"
              style={`view-transition-name: ${sanitizeViewTransitionName(post.id)}`}
            >
              {post.title}
            </h2>
            <time 
              class="post-date" 
              datetime={new Date(post.date).toISOString()}
            >
              {formatDate(post.date)}
            </time>
          </a>

          <div class="post-excerpt">{@html post.excerptHtml}</div>

          <div class="post-tags">
            {#each post.tags || [] as tag}
              <a 
                href={getTagUrl(tag)} 
                class="post-tag"
                class:highlighted={selectedTags && selectedTags instanceof Set && selectedTags.has(tag)}
              >
                #{tag}
              </a>
            {/each}
          </div>
        </div>

        {#if index !== postsArr.length - 1}
          <div class="divider"></div>
        {/if}
      </li>
    {/each}
  </ul>
{/if}
<style>
  /* 将原组件的 CSS 内容直接放入此处 */
  @import "./PostCardList.css";
</style>