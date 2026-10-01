<!-- PostList.svelte -->
<script lang="ts">
  import { t } from "@/utils/i18n";
  import { getPostUrl, getTagUrl, sanitizeViewTransitionName } from "@/utils/helpers";

  interface Post {
    id: string;
    data: {
      title: string;
      date: string | Date;
      tags: string[];
    };
  }

  export let posts: Post[];
  $: postsArr = posts;
</script>

{#if postsArr.length === 0}
  <p class="no-results">{t('common.posts.noResults')}</p>
{:else}
  <ul class="posts-list">
    {#each postsArr as post (post.id)}
      <li class="timeline-post"><article>
        <div class="post-content">
          <div class="post-info">
            <time class="post-date" datetime={new Date(post.data.date).toISOString()}>
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

            <a href={getPostUrl(post.id)} class="post-link">
              <h5
                class="post-title"
                style={`view-transition-name: ${sanitizeViewTransitionName(post.id)}`}
              >
                {post.data.title}
              </h5>
            </a>

            <div class="post-tags">
              {#each post.data.tags || [] as tag (tag)}
                <a href={getTagUrl(tag)} class="inline-tag">
                  #{tag}
                </a>
              {/each}
            </div>
          </div>
        </div>
      </article></li>
    {/each}
  </ul>
{/if}

<style>
  @import './PostList.css';
</style>
