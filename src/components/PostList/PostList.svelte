<!-- PostList.svelte（开启 TypeScript 支持） -->
<script lang="ts">
  // 导入 CSS 样式文件，与原 React 组件一致
  import "./PostList.css";

  // 定义类型接口，与原 React 组件的 Interface 完全一致
  interface Post {
    id: string;
    data: {
      title: string;
      date: string | Date;
      tags: string[];
    };
  }

  // 声明 Svelte 组件属性，对应原 React 的 PostListProps
  export let posts: Post[]; // 必传属性：返回 Post 数组的函数
  export let selectedTags: () => Set<string> | null = () => null; // 可选属性，设置默认值
  export let transition: any; // 可选属性，保留原组件的 transition 入参（未使用，保持扩展性）

  // 预处理文章数组，避免多次调用 posts() 函数，提升性能
  const postsArr = posts;

  // 提取公共的 safeId 处理函数（复用原组件的正则替换逻辑）
  const getSafeId = (id: string) => {
    return String(id).replace(/[^a-zA-Z0-9_-]/g, '-');
  };
</script>

<!-- Svelte 条件渲染：替代 React 的三元表达式 -->
{#if postsArr.length === 0}
  <p class="no-results">没有找到匹配的文章</p>
{:else}
  <ul class="posts-list">
    <!-- Svelte 列表循环：替代 React 的 Array.map()，指定 post.id 作为唯一 key 提升性能 -->
    {#each postsArr as post (post.id)}
      <article class="timeline-post">
        <div class="post-content">
          <div class="post-info">
            <!-- 日期格式化：完全保留原 React 组件的处理逻辑 -->
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

            <!-- 文章链接：保留原路由规则，内联样式绑定 view-transition-name -->
            <a href={`/posts/${post.id}`} class="post-link">
              <h5 
                class="post-title"
                style={`view-transition-name: post-${getSafeId(post.id)}`}
              >
                {post.data.title}
              </h5>
            </a>

            <!-- 标签列表：循环渲染，处理空标签数组避免报错 -->
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
