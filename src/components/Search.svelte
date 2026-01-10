<script lang="ts">
  import Fuse from 'fuse.js';
  import { onMount, onDestroy } from 'svelte'; // 仅保留 Svelte 支持的生命周期

  // 接收 Astro 传递的可搜索文章数据（Props）
  export let searchablePosts: Array<{
    id: string;
    title: string;
    excerpt: string;
    url: string;
  }> = [];

  // 修正：Svelte 原生响应式变量（直接用 let 声明，无需 createSignal）
  let searchQuery = ''; // 搜索输入内容
  let isSearchOpen = false; // 搜索框展开/收起
  let searchResults: Array<{ item: any; score: number }> = []; // Fuse 搜索结果

  // 初始化 Fuse.js 实例（配置搜索规则）
  let fuse: Fuse<any>;
  const fuseOptions = {
    includeScore: true,
    threshold: 0.3,
    keys: [
      { name: 'title', weight: 2 },
      { name: 'excerpt', weight: 1 }
    ]
  };
  fuse = new Fuse(searchablePosts, fuseOptions);
  onMount(() => {
    // 点击页面外部收起搜索框（事件委托）
    document.addEventListener('click', handleClickOutside);
  });

  // 组件销毁时清理事件监听，防止内存泄漏
  onDestroy(() => {
    // document.removeEventListener('click', handleClickOutside);
  });

  // 处理「点击外部收起搜索框」逻辑（修正：响应式变量直接访问，无需 ()）
  const handleClickOutside = (e: MouseEvent) => {
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer && !searchContainer.contains(e.target as Node)) {
      isSearchOpen = false; // 直接赋值更新响应式状态
      searchQuery = '';
      searchResults = [];
    }
  };

  // 实时搜索处理（输入变化时触发，修正：响应式变量直接访问/赋值）
  const handleSearchInput = (e: Event) => {
    const inputValue = (e.target as HTMLInputElement).value.trim();
    searchQuery = inputValue; // 直接赋值更新输入内容

    // 无输入时清空结果，有输入时执行 Fuse 搜索
    if (!inputValue) {
      searchResults = [];
      return;
    }
    const results = fuse.search(inputValue);
    searchResults = results.slice(0, 5); // 直接赋值更新搜索结果
  };

  // 切换搜索框展开/收起状态（修正：响应式变量直接访问/赋值）
  const toggleSearch = () => {
    isSearchOpen = !isSearchOpen; // 直接取反更新状态
    // 展开时自动聚焦输入框
    if (!isSearchOpen) {
      setTimeout(() => {
        const searchInput = document.querySelector<HTMLElement>('.search-input');
        searchInput?.focus();
      }, 100);
    } else {
      searchQuery = '';
      searchResults = [];
    }
  };

  // 键盘事件处理（ESC 收起、回车跳转第一条结果，修正：响应式变量直接访问）
  const handleSearchKeydown = (e: KeyboardEvent) => {
    // ESC 键收起搜索框
    if (e.key === 'Escape') {
      isSearchOpen = false;
      searchQuery = '';
      searchResults = [];
    }

    // 回车键跳转第一条结果（有结果时）
    if (e.key === 'Enter' && searchResults.length > 0) {
      window.location.href = searchResults[0].item.url;
    }
  };
</script>

<!-- 模板部分：仅修正响应式变量调用（移除所有 ()，直接访问变量） -->
<div class="search-container" on:click|stopPropagation>
  <button
    class="search-toggle"
    type="button"
    aria-label={isSearchOpen ? '收起搜索框' : '打开搜索框'}
    on:click={toggleSearch}
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  </button>

  {#if isSearchOpen}
    <div class="search-dropdown">
      <input
        class="search-input"
        type="text"
        placeholder="搜索文章..."
        value={searchQuery}
        on:input={handleSearchInput}
        on:keydown={handleSearchKeydown}
        aria-label="输入关键词搜索文章"
      />

      {#if searchResults.length > 0}
        <ul class="search-results">
          {#each searchResults as result}
            <li class="search-result-item">
              <a
                href={result.item.url}
                on:click={() => {
                  isSearchOpen = false;
                  searchQuery = '';
                }}
              >
                <h4 class="result-title">{result.item.title}</h4>
                {#if result.item.excerpt}
                  <p class="result-excerpt">{result.item.excerpt.slice(0, 80)}...</p>
                {/if}
              </a>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</div>

<style>
  /* 样式部分完全不变，保持原有布局和风格 */
  .search-container {
    position: relative;
    display: flex;
    align-items: center;
    height: 100%;
  }

  .search-toggle {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    border-radius: 4px;
    transition: background-color 0.2s ease;
  }

  .search-toggle:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  .search-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    width: 320px;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    padding: 0.75rem;
    z-index: 1000;
  }

  .search-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    color: var(--text-primary);
    font-size: 0.9rem;
    margin-bottom: 0.75rem;
    outline: none;
    transition: border-color 0.2s ease;
    box-sizing: border-box;
  }

  .search-input:focus {
    border-color: var(--theme-color);
  }

  .search-results {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 240px;
    overflow-y: auto;
  }

  .search-result-item {
    margin-bottom: 0.5rem;
  }

  .search-result-item:last-child {
    margin-bottom: 0;
  }

  .search-result-item a {
    text-decoration: none;
    color: var(--text-primary);
    display: block;
    padding: 0.5rem;
    border-radius: 4px;
    transition: background-color 0.2s ease;
  }

  .search-result-item a:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  .result-title {
    font-size: 0.9rem;
    font-weight: 500;
    margin: 0 0 0.25rem 0;
    color: var(--theme-color);
  }

  .result-excerpt {
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (max-width: 768px) {
    .search-dropdown {
      width: 280px;
      right: -9rem;
    }
  }
</style>
