<!-- PostList.svelte（开启 TypeScript 支持） -->
<script lang="ts">
  import "./PostList.css";

  interface Post {
    id: string;
    data: {
      title: string;
      date: string | Date;
      tags: string[];
    };
  }

  export let posts: Post[]; 
  export let selectedTags: () => Set<string> | null = () => null;
  export let transition: any;

  const postsArr = posts;
  const getSafeId = (id: string) => {
    return String(id).replace(/[^a-zA-Z0-9_-]/g, '-');
  };
</script>

{#if postsArr.length === 0}
  <p class="no-results">没有找到匹配的文章</p>
{:else}
  <ul class="posts-list">
    {#each postsArr as post (post.id)}
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
              <h5 
                class="post-title"
                style={`view-transition-name: post-${getSafeId(post.id)}`}
              >
                {post.data.title}
              </h5>
            </a>

            <div class="post-tags">
              {#each post.data.tags || [] as t}
                <a href={`/tags/${t}`} class="inline-tag">
                  #{t}
                </a>
              {/each}
            </div>
          </div>
        </div>
      </article>
    {/each}
  </ul>
{/if}
