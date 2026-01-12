<!-- PostCardList.svelte -->
<script>
  import { sanitizeViewTransitionName, getTagUrl } from "@/utils/helpers";
  import { formatDate } from "@/utils/helpers";
  import { t } from "@/utils/i18n";
  export let posts = [];
  export let selectedTags = null;

  const postsArr = (typeof posts === "function" ? posts() : posts || []).sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
</script>

{#if postsArr.length === 0}
  <p class="no-results">{t('common.posts.noResults')}</p>
{:else}
  <ul class="posts-list">
    {#each postsArr as post, index (post.id)}
      <li class="post-item-con" class:pinned={post.pinned}>
        <div class="post-item">
          <a href={post.url} class="post-link">
            <h2
              class="post-title"
              style={`view-transition-name: ${sanitizeViewTransitionName(post.id)}`}
            >
              {post.pinned ? '📌 ' : ''}{post.title}
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
                class:highlighted={selectedTags &&
                  selectedTags instanceof Set &&
                  selectedTags.has(tag)}
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
  .posts-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .post-item {
    padding: 20px;
    border-radius: 8px;
    margin: 20px 0;
    transition: background-color 0.3s ease;
    position: relative;
  }

  .post-item:hover {
    background-color: var(--color-theme-mix-5);
  }

  .divider {
    height: 1px;
    background-color: var(--border-color);
    margin: 0;
    transition: background-color 0.3s ease;
  }

  .post-link {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    text-decoration: none;
    color: inherit;
    margin-bottom: 12px;
    gap: 16px;
  }

  .post-title {
    font-weight: 600;
    color: var(--text-primary);
    font-size: 20px;
    line-height: 1.4;
    flex: 1;
    margin: 0;
    transition: color 0.2s ease;
  }

  .post-item:hover .post-title {
    color: var(--theme-color);
  }

  .post-date {
    font-size: 14px;
    color: var(--text-secondary);
    white-space: nowrap;
    padding: 4px 8px;
    border-radius: 4px;
    transition: color 0.2s ease;
  }

  .post-item:hover .post-date {
    color: var(--theme-color);
  }

  .post-excerpt {
    color: var(--text-secondary);
    font-size: 15px;
    line-height: 1.6;
    margin: 0 0 16px 0;
  }

  .no-results {
    text-align: center;
    padding: 48px 32px;
    font-style: italic;
    color: var(--text-secondary);
    margin: 32px 0;
  }

  /* .post-item-con.pinned .post-item {
    border-left: 3px solid var(--theme-color);
    background-color: var(--color-theme-mix-5);
  } */

  @media (max-width: 768px) {
    .post-link {
      align-items: flex-start;
      gap: 8px;
    }

    .post-date {
      align-self: flex-start;
    }

    .post-item {
      padding: 16px 10px;
    }

    .post-title {
      font-size: 18px;
    }
  }
</style>
