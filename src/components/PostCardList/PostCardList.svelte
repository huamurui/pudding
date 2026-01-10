<!-- PostCardList.svelte -->
<script>
  // 导入原组件的工具函数，路径保持不变
  import { sanitizeViewTransitionName, getTagUrl } from "../../utils/helpers";
  import { formatDate } from "../../utils/helpers";
  // 导入 CSS 样式文件，Svelte 支持直接导入外部 CSS
  import "./PostCardList.css";

  // Svelte 中声明组件属性（对应 Astro.props），并设置默认值
  export let posts = [];
  export let selectedTags = null;

  // 处理文章数组，逻辑与原组件完全一致
  const postsArr = typeof posts === 'function' ? posts() : posts || [];
</script>

<!-- Svelte 条件渲染：替代原组件的三元表达式 -->
{#if postsArr.length === 0}
  <p class="no-results">没有找到匹配的文章</p>
{:else}
  <ul class="posts-list">
    <!-- Svelte 列表循环：替代 Array.map，支持索引获取，推荐指定 key 提升性能 -->
    {#each postsArr as post, index (post.id)}
      <li class="post-item-con">
        <div class="post-item">
          <a href={post.url} class="post-link">
            <!-- 内联样式绑定：保持 view-transition-name 逻辑不变 -->
            <h2 
              class="post-title"
              style={`view-transition-name: ${sanitizeViewTransitionName(post.id)}`}
            >
              {post.title}
            </h2>
            <!-- 日期格式化与原组件一致，datetime 属性正常绑定 -->
            <time 
              class="post-date" 
              datetime={new Date(post.date).toISOString()}
            >
              {formatDate(post.date)}
            </time>
          </a>

          <!-- Svelte 原始 HTML 渲染：与 Astro 的 @html 语法完全一致 -->
          <div class="post-excerpt">{@html post.excerptHtml}</div>

          <div class="post-tags">
            <!-- 标签列表循环，可选链操作符保持不变 -->
            {#each post.tags || [] as tag}
              <!-- Svelte 动态 class 绑定：更简洁的语法替代模板字符串 -->
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

        <!-- 分隔线：仅非最后一项渲染，保持原组件逻辑 -->
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