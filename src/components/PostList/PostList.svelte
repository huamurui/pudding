<!-- PostList.svelte（开启 TypeScript 支持） -->
<script lang="ts">
  interface Post {
    id: string;
    data: {
      title: string;
      date: string | Date;
      tags: string[];
    };
  }

  export let posts: Post[];
  const postsArr = posts;
  const getSafeId = (id: string) => {
    return String(id).replace(/[^a-zA-Z0-9_-]/g, "-");
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
              <div class="post-marker"></div>
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

<style>
  .posts-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .timeline-post {
    position: relative;
    padding: 0;
  }

  .post-info {
    display: flex;
    align-items: center;
    gap: 20px;
    height: 40px;
    border-radius: 8px;
    transition: background-color 0.2s ease;
  }

  .post-info.year:hover {
    background-color: transparent;
  }

  .post-info:hover {
    background-color: color-mix(in srgb, var(--theme-color) 5%, transparent);
  }

  /* 日期样式（左侧固定宽度） */
  .post-date {
    font-size: 14px;
    color: var(--text-secondary);
    width: 60px;
    text-align: right;
    white-space: nowrap;
  }

  .post-date.year {
    font-weight: 600;
    font-size: 16px;
  }

  .timeline-connector {
    position: relative;
    flex-shrink: 0;
    height: 100%;
    width: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .timeline-connector::before {
    content: "";
    position: absolute;
    width: 10%;
    height: 100%;
    left: calc(50% - 1px);
    border-left: 2px dashed var(--border-color);
    z-index: -1;
    pointer-events: none;
    transition: all 0.3s;
    transform: translateY(-50%);
  }

  .timeline-connector.year::before {
    display: none;
  }

  .post-marker {
    width: 6px;
    height: 6px;
    border-radius: 6px;
    background-color: var(--text-secondary);
    transition: all 0.2s ease;
  }

  .post-marker.year {
    transform: scale(1.5);
    background-color: var(--theme-color);
  }

  .post-info:hover .post-marker {
    background-color: var(--theme-color);
    height: 20px;
    position: relative;
  }

  .post-info:hover .post-marker.year {
    width: 6px;
    height: 6px;
    transform: scale(2);
    background-color: var(--theme-color);
  }

  .post-link {
    text-decoration: none;
    flex: 1;
  }

  .post-link:after {
    display: none;
  }
  .post-title {
    margin: 0;
    font-weight: 600;
    font-size: 16px;
    color: var(--text-primary);
    transition:
      color 0.2s ease,
      transform 0.2s ease;
  }

  .post-info:hover .post-title {
    color: var(--theme-color);
    transform: translateX(4px);
  }

  @media (max-width: 600px) {
    .timeline-container {
      padding-left: 30px;
    }

    .year-section::before,
    .year-marker::before {
      left: -20px;
    }

    .post-info {
      flex-wrap: wrap;
      gap: 12px;
    }

    .post-date {
      width: auto;
      text-align: left;
      padding-right: 12px;
    }

    div.post-tags {
      margin-top: 8px;
      display: none;
    }
  }
</style>
