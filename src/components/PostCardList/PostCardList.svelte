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
              {#if post.pinned}<span class="pinned-badge">置顶</span>{/if}{post.title}
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
    padding: 16px 20px;
    border-radius: 16px;
    margin: 8px 0;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    border: 1px solid transparent;
  }

  .post-item:hover {
    background-color: color-mix(in srgb, var(--primary-color) 4%, transparent);
    transform: scale(1.02);
  }

  .divider {
    height: 1px;
    background-color: color-mix(in srgb, var(--border-color) 60%, transparent);
    margin: 0 20px;
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
    font-size: 1.25rem;
    line-height: 1.5;
    flex: 1;
    margin: 0;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .pinned-badge {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--primary-color);
    background-color: color-mix(in srgb, var(--primary-color) 15%, transparent);
    padding: 3px 8px;
    border-radius: 6px;
    margin-right: 8px;
    vertical-align: middle;
    display: inline-block;
    transform: translateY(-2px);
  }

  .post-date {
    font-size: 0.9rem;
    color: var(--text-secondary);
    white-space: nowrap;
    padding: 4px 0;
    transition: color 0.2s ease;
    font-family: "Nunito", var(--font-family-base);
  }

  .post-excerpt {
    color: var(--text-secondary);
    font-size: 0.95rem;
    line-height: 1.6;
    margin: 0 0 16px 0;
  }
  
  .post-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .post-tag {
    font-size: 0.8rem;
    color: var(--text-muted);
    text-decoration: none;
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .post-tag:hover {
    color: var(--primary-color);
    transform: translateY(-1px);
  }

  .no-results {
    text-align: center;
    padding: 48px 32px;
    font-style: italic;
    color: var(--text-secondary);
    margin: 32px 0;
  }

  @media (max-width: 768px) {
    .post-link {
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
    }

    .post-date {
      align-self: flex-start;
      padding: 0;
      font-size: 0.85rem;
    }

    .post-item {
      padding: 16px 12px;
    }

    .post-title {
      font-size: 1.15rem;
    }
  }
</style>
